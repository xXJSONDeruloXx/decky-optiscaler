# justfile

# clear cached dependencies and build with vscode
rebuild:
    rm -rf node_modules
    rm -rf out
    mkdir -p out
    .vscode/build.sh
    scp ~/Developer/decky-optiscaler/out/decky-optiscaler.zip deck@192.168.0.6:~/Desktop

# build and test with ssh monitoring
test:
    rm -rf node_modules
    rm -rf out
    mkdir -p out
    .vscode/build.sh
    scp ~/Developer/decky-optiscaler/out/decky-optiscaler.zip deck@192.168.0.6:~
    ssh deck@192.168.0.6 "journalctl --follow"
    