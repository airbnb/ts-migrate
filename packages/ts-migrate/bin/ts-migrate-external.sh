#!/bin/bash

set -e

frontend_folder=$1
folder_name=`basename $1`
cli="./node_modules/.bin/ts-migrate"
step_i=1
step_count=4
tsc_path="./node_modules/.bin/tsc"
should_remove_eslintrc=false


echo "Welcome to TS Migrate! :D

This script will migrate a frontend folder to a compiling (or almost compiling) TS project.

It is recommended that you take the following steps before continuing...

1. Make sure you have a clean git slate.
   Run \`git status\` to make sure you have no local changes that may get lost.
   Check in or stash your changes, then re-run this script.

2. Check out a new branch for the migration.
   For example, \`git checkout -b $(whoami)--ts-migrate\` if you're migrating several folders or
   \`git checkout -b $(whoami)--ts-migrate-$folder_name\` if you're just migrating $frontend_folder.

3. Make sure you're on the latest, clean master.
   \`git fetch origin master && git reset --hard origin/master\`

4. Make sure you have the latest npm modules installed.
   \`npm install\`

If you need help or have feedback, please reach out in #ts-migrate on Slack.
"

read -p "Continue? (y/N) " should_fetch_and_reset
if [ "$should_fetch_and_reset" != "y" ] && [ "$should_fetch_and_reset" != "Y" ] # lol
then
  echo "See you later."
  exit
fi

read -p "Set a custom path for the typescript compiler. (It's an optional step. Skip if you don't need it. Default path is ./node_modules/.bin/tsc.): " custom_tsc_path
if [[ -z "$custom_tsc_path" ]]; then
  echo "Your default tsc path is $tsc_path."
else
  tsc_path=$custom_tsc_path;
fi

echo "
[Step $((step_i++)) of ${step_count}] Initializing ts-config for the \"$frontend_folder\"...
"

if [ ! -f "$frontend_folder/tsconfig.json" ]; then
  $cli init $frontend_folder
fi

if [ ! -f "$frontend_folder/.eslintrc" ]; then
  touch $frontend_folder/.eslintrc
  should_remove_eslintrc=true
fi


if [[ `git status --porcelain` ]]
then
  git add . && git commit -m "[ts-migrate][$folder_name] Init tsconfig.json file" -m 'Co-authored-by: ts-migrate <>'
fi

echo "
[Step $((step_i++)) of ${step_count}] Renaming files from JS/JSX to TS/TSX and updating project.json\...
"
$cli rename $frontend_folder

if [[ `git status --porcelain` ]]
then
  git add . && git commit -m "[ts-migrate][$folder_name] Rename files from JS/JSX to TS/TSX" -m 'Co-authored-by: ts-migrate <>'
fi

echo "
[Step $((step_i++)) of ${step_count}] Fixing TypeScript errors...
"
$cli migrate $frontend_folder --aliases=default

if [ "$should_remove_eslintrc" = "true" ]; then
  rm $frontend_folder/.eslintrc
fi

if [[ `git status --porcelain` ]]
then
  git add . && git commit -m "[ts-migrate][$folder_name] Run TS Migrate" -m 'Co-authored-by: ts-migrate <>'
fi


echo "
[Step $((step_i++)) of ${step_count}] Checking for TS compilation errors (there shouldn't be any).
"
echo "$tsc_path -p $frontend_folder/tsconfig.json"
$tsc_path -p $frontend_folder/tsconfig.json --noEmit

echo "
---
All done!

The recommended next steps are...

1. Sanity check your changes locally by inspecting the commits and loading the affected pages.

2. Push your changes with \`git push\`.

3. Open a PR!
"
