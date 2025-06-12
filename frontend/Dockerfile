FROM node:22-alpine

WORKDIR /app

COPY frontend /app

RUN npm install && npm run build

# 使用 nginx 來 serve build 後的靜態頁面
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
