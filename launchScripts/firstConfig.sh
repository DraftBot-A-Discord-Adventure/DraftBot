#!/bin/bash

# Set path to the root of the project
cd "$(dirname "$0")/.." || exit

# Define paths to be used
LIB_PATH="./Lib"
DISCORD_PATH="./Discord"
CORE_PATH="./Core"
YARN_BASE_VERSION="4.5.1"

# Step 1: Remove node_modules and dist folders if they exist
echo "Removing node_modules and dist directories if they exist..."

for dir in "$CORE_PATH" "$DISCORD_PATH" "$LIB_PATH"; do
  if [ -d "$dir/node_modules" ]; then
    rm -rf "$dir/node_modules"
    echo "Removed $dir/node_modules"
  fi

  if [ -d "$dir/dist" ]; then
    rm -rf "$dir/dist"
    echo "Removed $dir/dist"
  fi
done

# Step 2: Enable corepack
corepack enable

# Step 3: Set Yarn version to stable if not already set
YARN_VERSION=$(yarn -v>/dev/null)
if [ "$YARN_VERSION" != $YARN_BASE_VERSION ]; then
  echo "Setting Yarn version to stable..."
  yarn set version stable
else
  echo "Yarn version is already stable."
fi

# Step 4: Remove package.json at the project root if it exists
if [ -f "./package.json" ]; then
  rm "./package.json"
  echo "Removed root package.json"
fi

# Step 5: Install dependencies in Core, Discord, and Lib directories
for dir in "$CORE_PATH" "$DISCORD_PATH" "$LIB_PATH"; do
  if [ -d "$dir" ]; then
    echo "Installing dependencies in $dir..."
    (cd "$dir" && yarn install)
  fi
done

echo "First-time setup completed successfully!"
