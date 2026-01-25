const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, '..', 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// Check if yt-dlp is installed
const checkYtdlpInstallation = () => {
    return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', ['--version']);
        ytdlp.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error('yt-dlp not found'));
            }
        });
        ytdlp.on('error', () => {
            reject(new Error('yt-dlp not found'));
        });
    });
};

// Download video using yt-dlp
const downloadVideo = async (videoUrl, filename) => {
    return new Promise((resolve, reject) => {
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const outputPath = path.join(downloadsDir, `${sanitizedFilename}.mp4`);

        // yt-dlp command with optimized options
        const ytdlp = spawn('yt-dlp', [
            videoUrl,
            '-o', outputPath,
            '--format', 'best[ext=mp4]/best[height<=720]/best',
            '--merge-output-format', 'mp4',
            '--embed-metadata',
            '--no-playlist',
            '--progress'
        ]);

        let outputData = '';
        let errorData = '';

        ytdlp.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        ytdlp.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        ytdlp.on('close', (code) => {
            if (code === 0) {
                // Check if file was created
                if (fs.existsSync(outputPath)) {
                    const stats = fs.statSync(outputPath);
                    resolve({
                        success: true,
                        filePath: outputPath,
                        fileName: `${sanitizedFilename}.mp4`,
                        fileSize: stats.size
                    });
                } else {
                    reject(new Error('Download completed but file not found'));
                }
            } else {
                reject(new Error(`yt-dlp failed with code ${code}: ${errorData}`));
            }
        });

        ytdlp.on('error', (error) => {
            reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
        });

        // Set timeout (10 minutes)
        const timeout = setTimeout(() => {
            ytdlp.kill();
            reject(new Error('Download timeout (10 minutes)'));
        }, 10 * 60 * 1000);

        ytdlp.on('close', () => {
            clearTimeout(timeout);
        });
    });
};

// API endpoint to initiate video download
router.post('/download', async (req, res) => {
    try {
        const { videoUrl, filename } = req.body;

        if (!videoUrl || !filename) {
            return res.status(400).json({
                success: false,
                error: 'Missing videoUrl or filename'
            });
        }

        // Check if yt-dlp is available
        try {
            await checkYtdlpInstallation();
        } catch (error) {
            console.error('yt-dlp not installed:', error);
            return res.status(500).json({
                success: false,
                error: 'yt-dlp is not installed on the server',
                message: 'Please install yt-dlp: pip install yt-dlp'
            });
        }

        // Start download
        const result = await downloadVideo(videoUrl, filename);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to serve downloaded files
router.get('/file/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(downloadsDir, filename);

        // Security check - ensure filename doesn't contain path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        const stats = fs.statSync(filePath);
        
        // Set headers for file download
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up file after download (optional - comment out if you want to keep files)
        fileStream.on('end', () => {
            setTimeout(() => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    // Silent cleanup error
                }
            }, 5000); // Delete after 5 seconds
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to check yt-dlp status
router.get('/status', async (req, res) => {
    try {
        await checkYtdlpInstallation();
        res.json({
            success: true,
            message: 'yt-dlp is installed and ready'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'yt-dlp is not installed',
            message: 'Please install yt-dlp: pip install yt-dlp'
        });
    }
});

// Clean up old downloads (run periodically)
const cleanupOldDownloads = () => {
    try {
        const files = fs.readdirSync(downloadsDir);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(downloadsDir, file);
            const stats = fs.statSync(filePath);
            
            // Delete files older than 1 hour
            if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        // Silent cleanup error
    }
};

// Run cleanup every 30 minutes
setInterval(cleanupOldDownloads, 30 * 60 * 1000);

module.exports = router;
