#!/usr/bin/env node

/**
 * Cordova hook script to fix duplicate application tags in AndroidManifest.xml
 * and add tools:overrideLibrary configuration for AndroidX libraries
 * This ensures that the Android manifest is valid and the app can load local web pages
 * and run on Android 16 despite using AndroidX libraries that require higher SDK versions
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
                
                // Add tools namespace and overrideLibrary configuration to the manifest tag
                console.log('Adding tools:overrideLibrary configuration for AndroidX libraries');
                const manifestTagRegex = /<manifest([^>]*)>/;
                if (manifestTagRegex.test(manifestContent)) {
                    // Check if tools namespace is already present
                    if (!manifestContent.includes('xmlns:tools="http://schemas.android.com/tools"')) {
                        // Add tools namespace
                        manifestContent = manifestContent.replace(manifestTagRegex, '<manifest$1 xmlns:tools="http://schemas.android.com/tools">');
                    }
                    
                    // Check if overrideLibrary is already present
                    if (!manifestContent.includes('tools:overrideLibrary')) {
                        // Add overrideLibrary attribute
                        manifestContent = manifestContent.replace(
                            /<manifest([^>]*)>/,
                            '<manifest$1 tools:overrideLibrary="androidx.appcompat.resources, androidx.appcompat, androidx.core, androidx.webkit">'
                        );
                    }
                }
                
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
                    // No duplicate application tags, just write back the content with tools:overrideLibrary
                    fs.writeFileSync(manifestPath, manifestContent);
                    console.log('Added tools:overrideLibrary configuration to AndroidManifest.xml');
                }
            } else {
                console.log('AndroidManifest.xml not found:', manifestPath);
            }
        }
    });
};