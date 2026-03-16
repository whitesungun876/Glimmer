#!/usr/bin/env bash
# 安装项目全部依赖：前端 (根目录) + 后端 (server/)
# 用法: ./scripts/install-deps.sh  或  npm run install:all

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ">>> 安装根目录依赖 (前端: React, Capacitor, qrcode.react, axios, html2canvas...)"
npm install

echo ""
echo ">>> 安装 server 依赖 (express, pg, dotenv...)"
cd server && npm install && cd "$ROOT"

echo ""
echo ">>> 全部依赖已安装完成。"
