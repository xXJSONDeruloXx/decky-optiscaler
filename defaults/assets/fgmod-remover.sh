#!/usr/bin/env bash

# Remove ~/fgmod directory if it exists
if [[ -d "$HOME/fgmod" ]]; then
    rm -rf "$HOME/fgmod"
    echo "FGmod removed"
else
    echo "FGmod not found, nothing to remove"
fi

# Remove ~/opti directory if it exists
if [[ -d "$HOME/opti" ]]; then
    rm -rf "$HOME/opti"
    echo "OptiScaler removed"
else
    echo "OptiScaler not found, nothing to remove"
fi

echo "Cleanup complete"