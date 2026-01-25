# Vercel Deployment Instructions

## Prerequisites
- Vercel account
- GitHub repository connected to Vercel

## Deployment Steps

### 1. Push Changes to GitHub
```bash
git add .
git commit -m "Configure for Vercel deployment with video streaming support"
git push origin main
```

### 2. Configure Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Node.js Version**: `18.x` or higher

### 3. Environment Variables (if needed)
Add any environment variables in Vercel dashboard:
- API keys
- Authentication tokens
- Any other sensitive configuration

### 4. Deploy
- Click "Deploy" to start the deployment
- Vercel will automatically build and deploy your app

## Video Streaming Configuration

The deployment includes:

### API Proxies
- `/video-api-proxy/*` → `https://piewallahapi.vercel.app/api/*`
- `/video-proxy/*` → `https://sec-prod-mediacdn.pw.live/*`

### CORS Headers
- Proper CORS configuration for video streaming
- Cache headers for optimal performance
- Security headers maintained

### Video Player Features
- Live streaming support with Shaka Player
- Landscape orientation on fullscreen (mobile)
- Low-latency configuration
- Enhanced error handling

## Post-Deployment Testing

1. **Test Video Playback**
   - Navigate to your deployed app
   - Try playing a video
   - Check browser console for any errors

2. **Test Live Streaming**
   - Test with live stream URLs
   - Verify low-latency playback
   - Check mobile landscape orientation

3. **Debugging**
   - Check Vercel logs for any API proxy issues
   - Use browser Network tab to verify proxy requests
   - Console logs will show detailed streaming information

## Troubleshooting

### Common Issues

1. **Video Not Playing**
   - Check if manifest URLs are accessible
   - Verify CORS headers in browser dev tools
   - Check Vercel function logs

2. **Live Stream Issues**
   - Verify manifest format (.m3u8 or .mpd)
   - Check network connectivity
   - Review console for specific error codes

3. **Proxy Errors**
   - Check Vercel function logs
   - Verify target URLs are correct
   - Ensure proper headers are being forwarded

### Debug Commands
```bash
# Check Vercel logs
vercel logs

# Deploy with debug mode
vercel --debug
```

## Performance Optimization

- Video segments are cached for 1 hour
- API responses have no-cache for live data
- Proper compression and headers configured
- CDN integration through Vercel's edge network

The deployment should maintain the same video streaming functionality as your local development environment.
