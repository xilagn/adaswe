#!/usr/bin/env node

/**
 * Cordova hook script to copy network_security_config.xml to Android platform
 * This ensures that the network security configuration is available for HTTP connections
 */

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    console.log('Running after_platform_add hook: Copying network_security_config.xml');
    
    const platforms = context.opts.platforms;
    
    platforms.forEach(platform => {
        if (platform === 'android') {
            console.log('Processing Android platform');
            
            // Source path for network_security_config.xml
            const sourceConfig = path.join(context.opts.projectRoot, 'res', 'xml', 'network_security_config.xml');
            
            // Destination path in Android platform
            const destConfig = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml');
            
            // Ensure source directory exists
            const sourceDir = path.dirname(sourceConfig);
            if (!fs.existsSync(sourceDir)) {
                fs.mkdirSync(sourceDir, { recursive: true });
                console.log('Created source directory:', sourceDir);
            }
            
            // Create network_security_config.xml if it doesn't exist
            if (!fs.existsSync(sourceConfig)) {
                const configContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">107.174.240.113</domain>
    </domain-config>
</network-security-config>`;
                
                fs.writeFileSync(sourceConfig, configContent);
                console.log('Created network_security_config.xml:', sourceConfig);
            }
            
            // Ensure destination directory exists
            const destDir = path.dirname(destConfig);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
                console.log('Created destination directory:', destDir);
            }
            
            // Copy the file
            try {
                fs.copyFileSync(sourceConfig, destConfig);
                console.log('Copied network_security_config.xml to:', destConfig);
            } catch (error) {
                console.error('Error copying network_security_config.xml:', error.message);
            }
        }
    });
};