# Android SDK Environment Setup Script
# Run this script before building Android app

Write-Host "Setting up Android SDK environment variables..." -ForegroundColor Green

# Set Android SDK paths
$env:ANDROID_HOME = "C:\Users\devart\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\devart\AppData\Local\Android\Sdk"

# Verify the paths exist
if (Test-Path $env:ANDROID_HOME) {
    Write-Host "✅ ANDROID_HOME set to: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "❌ ANDROID_HOME path does not exist: $env:ANDROID_HOME" -ForegroundColor Red
}

if (Test-Path $env:ANDROID_SDK_ROOT) {
    Write-Host "✅ ANDROID_SDK_ROOT set to: $env:ANDROID_SDK_ROOT" -ForegroundColor Green
} else {
    Write-Host "❌ ANDROID_SDK_ROOT path does not exist: $env:ANDROID_SDK_ROOT" -ForegroundColor Red
}

Write-Host "Environment setup complete. You can now run Android build commands." -ForegroundColor Green
