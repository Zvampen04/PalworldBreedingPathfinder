#!/usr/bin/env python3
import sys

print(f"TEST: Python version: {sys.version}")
print(f"TEST: Number of arguments: {len(sys.argv)}")
print(f"TEST: Arguments: {sys.argv}")

for i, arg in enumerate(sys.argv):
    print(f"TEST: Arg {i}: '{arg}'")

if len(sys.argv) >= 3:
    print("TEST: SUCCESS - Arguments were passed correctly")
else:
    print("TEST: FAILED - No arguments received") 