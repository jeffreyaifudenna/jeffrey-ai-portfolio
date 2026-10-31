#!/bin/sh
# Installs the pre-push hook so scripts/check.py runs before every push.
# Run once per clone: sh scripts/install-hooks.sh
cd "$(git rev-parse --show-toplevel)" || exit 1
cat > .git/hooks/pre-push <<'EOF'
#!/bin/sh
python scripts/check.py
EOF
chmod +x .git/hooks/pre-push
echo "pre-push hook installed."
