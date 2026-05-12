# Use official lightweight Nginx image
FROM nginx:alpine

# Remove default Nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy all static site files into the Nginx web root
COPY index.html /usr/share/nginx/html/
COPY build.html /usr/share/nginx/html/
COPY cart.html /usr/share/nginx/html/
COPY explore.html /usr/share/nginx/html/
COPY order.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY cart.js /usr/share/nginx/html/

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Configure Nginx to listen on port 8080
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
