#!/bin/bash
# Local/manual runner. The scheduled daily run uses the same instructions (daily_prompt.md) as a cloud routine.
cd "$(dirname "$0")"
touch topic_history.txt
claude -p "$(cat daily_prompt.md)"
echo "Daily short-form video generation task complete!"
