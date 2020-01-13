#!/bin/bash

script_path=`dirname $(realpath $0)`
folder_path=$( cd "$(dirname "${script_path}")" ; pwd -P )

ts_node="${folder_path}/node_modules/.bin/ts-node"
cli="${folder_path}/cli.ts"

$ts_node -T -O '{ "esModuleInterop": true }' --skip-project $cli "$@"
