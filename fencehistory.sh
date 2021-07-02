#!/usr/bin/env bash
if [ -z $1 ]; then
    REF='master'
else
    REF="$1"
fi

if [ -z $2 ]; then
    LEN=10
else
    LEN=$2
fi

# set -xe

echo "incremental fence-checking $LEN commits of history before $REF"

for oid in $(git rev-list $REF | head -n $LEN); do
    git checkout $oid --quiet
    echo -n "checking $oid .. "

    start_time=$(date +%s.%3N)
    OUTPUT=$(node --unhandled-rejections=strict --async-stack-traces ./node_modules/good-fences/lib/core/cli.js -p tsconfig.noprojects.json --rootDir packages shared -x --sinceGitHash $(git rev-parse HEAD~) 2>&1)
    EXITCODE=$?
    end_time=$(date +%s.%3N)

    # elapsed time with millisecond resolution
    # keep three digits after floating point.
    awk "BEGIN{print $end_time - $start_time}"
    if [[ "$EXITCODE" != "0" ]]; then
        echo "  ERROR ON COMMIT $oid"
        echo "$OUTPUT"
    fi
done