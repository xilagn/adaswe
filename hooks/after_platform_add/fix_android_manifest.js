#!/usr/bin/env node

/**
 * Cordova hook script to fix duplicate application tags in AndroidManifest.xml
 * This ensures that the Android manifest is valid and the app can load local web pages
 */

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    console.log('Running after_platform_add hook: Fixing duplicate application tags in AndroidManifest.xml');
    
    const platforms = context.opts.platforms;
    
    platforms.forEach(platform => {
        if (platform === 'android') {
            console.log('Processing Android platform');
            
            // Path to AndroidManifest.xml
            const manifestPath = path.join(context.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
            
            // Check if manifest file exists
            if (fs.existsSync(manifestPath)) {
                console.log('Found AndroidManifest.xml:', manifestPath);
                
                // Read the file content
                let manifestContent = fs.readFileSync(manifestPath, 'utf8');
                
                // Check for duplicate application tags
                const applicationTagRegex = /<application[^>]*>((?:[\s\S](?!<\/application>))*)<\/application>/g;
                const matches = [...manifestContent.matchAll(applicationTagRegex)];
                
                if (matches.length > 1) {
                    console.log(`Found ${matches.length} application tags, fixing...`);
                    
                    // Get the first application tag (which should be the complete one)
                    const firstApplicationTag = matches[0][0];
                    
                    // Remove all application tags
                    let fixedContent = manifestContent.replace(applicationTagRegex, '');
                    
                    // Add back only the first application tag
                    // Find the position where to insert the application tag (after the last uses-permission or uses-feature tag)
                    const lastPermissionRegex = /(<\/uses-(?:permission|feature)>)[\s\S]*?(?=<queries>|<application>)/;
                    const lastPermissionMatch = fixedContent.match(lastPermissionRegex);
                    
                    if (lastPermissionMatch) {
                        const insertionPoint = lastPermissionMatch.index + lastPermissionMatch[1].length;
                        fixedContent = fixedContent.substring(0, insertionPoint) + '\n    ' + firstApplicationTag + '\n' + fixedContent.substring(insertionPoint);
                    } else {
                        // If no permission tags found, insert after the manifest opening tag
                        const manifestOpeningRegex = /<manifest[^>]*>\s*/;
                        const manifestOpeningMatch = fixedContent.match(manifestOpeningRegex);
                        
                        if (manifestOpeningMatch) {
                            const insertionPoint = manifestOpeningMatch.index + manifestOpeningMatch[0].length;
                            fixedContent = fixedContent.substring(0, insertionPoint) + firstApplicationTag + '\n' + fixedContent.substring(insertionPoint);
                        }
                    }
                    
                    // Write the fixed content back to the file
                    fs.writeFileSync(manifestPath, fixedContent);
                    console.log('Fixed duplicate application tags in AndroidManifest.xml');
                } else {
                    console.log('No duplicate application tags found, AndroidManifest.xml is valid');
                }
            } else {
                console.log('AndroidManifest.xml not found:', manifestPath);
            }
        }
    });
};