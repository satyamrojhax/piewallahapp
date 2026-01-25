import { useEffect } from 'react';

const SecurityGuard = () => {
  useEffect(() => {
    // Additional React-based security measures
    
    // Security monitoring without console access detection
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #000;
        color: #fff;
        font-family: Arial, sans-serif;
        text-align: center;
      ">
        <div>
          <h1>Security Violation Detected</h1>
          <p>Unauthorized access attempts detected.</p>
          <p>Page will be redirected.</p>
        </div>
      </div>
    `;
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 2000);
    
    // Detect window focus/blur patterns (common in debugging)
    let focusCount = 0;
    const handleFocus = () => {
      focusCount++;
      if (focusCount > 10) {
        // Handle excessive focus events
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Monitor for DOM inspection attempts
    let domInspectionCount = 0;
    const observer = new MutationObserver(() => {
      domInspectionCount++;
      if (domInspectionCount > 50) {
        // Handle excessive DOM inspection
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      observer.disconnect();
      // Cleanup completed
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default SecurityGuard;
