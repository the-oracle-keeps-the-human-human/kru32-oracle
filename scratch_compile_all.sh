#!/bin/bash
# compile ทุกบท (improv_serial) → copy factory.bin → public/firmware/kru32-<id>.bin
cd /opt/Code/github.com/the-oracle-keeps-the-human-human/kru32-oracle || exit 1
pass=0; fail=0; failed=""
for d in lessons/*/; do
  dir=$(basename "$d")
  id=${dir#*-}                       # 05-time → time
  y=$(ls "$d"*.yaml 2>/dev/null | grep -v '.esphome' | head -1)
  [ -z "$y" ] && continue
  base=$(basename "$y")
  ( cd "$d" && timeout 420 uvx esphome compile "$base" >/tmp/kru_compile_$id.log 2>&1 )
  if grep -q "SUCCESS\|Successfully compiled" /tmp/kru_compile_$id.log; then
    fb=$(find "$d.esphome/build" -name firmware.factory.bin 2>/dev/null | head -1)
    if [ -n "$fb" ]; then
      cp "$fb" "public/firmware/kru32-$id.bin"
      sz=$(du -h "public/firmware/kru32-$id.bin" | awk '{print $1}')
      echo "✓ $dir → kru32-$id.bin ($sz)"
      pass=$((pass+1))
    else
      echo "✗ $dir — compiled แต่ไม่เจอ factory.bin"; fail=$((fail+1)); failed="$failed $id"
    fi
  else
    echo "✗ $dir — COMPILE FAILED (tail:)"; tail -3 /tmp/kru_compile_$id.log
    fail=$((fail+1)); failed="$failed $id"
  fi
done
echo "═══ DONE: pass=$pass fail=$fail ═══"
[ -n "$failed" ] && echo "FAILED:$failed"
