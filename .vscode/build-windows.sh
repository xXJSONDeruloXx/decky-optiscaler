#!/usr/bin/env bash
echo "Building Decky plugin in $(pwd)"

# Clean and build
echo "Cleaning previous build..."
rm -rf dist out

echo "Building with rollup..."
pnpm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Creating plugin structure..."
mkdir -p out

# Copy required files for the plugin
cp plugin.json out/
cp main.py out/
cp decky.pyi out/
cp package.json out/
cp -r dist/* out/
cp -r defaults out/ 2>/dev/null || true

# Create the plugin zip
echo "Creating plugin zip file..."
cd out
# Use PowerShell to create a zip file
powershell.exe -Command "Compress-Archive -Path '*' -DestinationPath '../decky-optiscaler.zip' -Force"
cd ..

echo "Plugin built successfully: decky-optiscaler.zip"
echo "You can now copy this zip file to your Steam Deck and install it via Decky Loader"
