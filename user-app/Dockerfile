FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY landing/ /usr/share/nginx/html
# Copy APK file if it exists
COPY user-app.apk /usr/share/nginx/html/ 2>/dev/null || true
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost || exit 1
