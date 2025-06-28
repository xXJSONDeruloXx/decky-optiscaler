# justfile

# clear cached dependencies and build with vscode
rebuild:
    rm -rf node_modules
    rm -rf out
    mkdir -p out
    .vscode/build.sh
    scp /Users/kurt/Developer/decky-optiscaler/out/decky-optiscaler.zip bazzite@192.168.0.117:~/Desktop

# build and test with ssh monitoring
test:
    rm -rf node_modules
    rm -rf out
    mkdir -p out
    .vscode/build.sh
    scp /Users/kurt/Developer/decky-optiscaler/out/decky-optiscaler.zip bazzite@192.168.0.117:~/Desktop
    ssh bazzite@192.168.0.117 "journalctl --follow"
    
# build without sending to deck
build:
    rm -rf node_modules
    rm -rf out
    mkdir -p out
    .vscode/build.sh