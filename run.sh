#!/bin/sh
set -e
rm -rf out && mkdir out
javac -d out $(find src/main -name '*.java')
java -cp out com.cabpool.App
