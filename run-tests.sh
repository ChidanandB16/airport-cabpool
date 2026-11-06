#!/bin/sh
# Compiles and runs the tests with just a JDK (Java 11+).
set -e
rm -rf out && mkdir out
javac -d out $(find src -name '*.java')
java -cp out com.cabpool.CabPoolTest
