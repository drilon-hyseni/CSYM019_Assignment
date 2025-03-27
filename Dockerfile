FROM php:8.1-fpm

# Install PHP MySQL extension
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy application files
COPY ./src /var/www/html

CMD ["php-fpm"]