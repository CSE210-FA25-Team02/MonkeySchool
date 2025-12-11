# Deployment Configuration

This directory contains deployment-related configuration files for the MonkeySchool application.

## Apache Configuration

### SSL Virtual Host Configuration

**File:** `apache/monkeyschool.indresh.me-le-ssl.conf`

This Apache virtual host configuration file sets up HTTPS (SSL/TLS) for the MonkeySchool application running on Oracle Cloud Infrastructure.

#### Configuration Details

- **Server Name**: `monkeyschool.indresh.me`
- **Reverse Proxy**: Apache proxies requests to the Node.js application running on `127.0.0.1:13215`
- **SSL/TLS**: Configured with Let's Encrypt certificates
- **Logging**: Error and access logs are written to Apache log directory

#### Installation

To use this configuration on an Apache server:

1. Copy the configuration file to Apache's sites-available directory:

   ```bash
   sudo cp apache/monkeyschool.indresh.me-le-ssl.conf /etc/apache2/sites-available/
   ```

2. Enable the site:

   ```bash
   sudo a2ensite monkeyschool.indresh.me-le-ssl.conf
   ```

3. Enable required Apache modules:

   ```bash
   sudo a2enmod ssl
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   ```

4. Test the configuration:

   ```bash
   sudo apache2ctl configtest
   ```

5. Reload Apache:
   ```bash
   sudo systemctl reload apache2
   ```

#### SSL Certificate Setup

This configuration uses Let's Encrypt certificates. To set up SSL certificates:

1. Install Certbot:

   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-apache
   ```

2. Obtain certificate:

   ```bash
   sudo certbot --apache -d monkeyschool.indresh.me
   ```

3. Set up automatic renewal (usually configured automatically by Certbot):
   ```bash
   sudo certbot renew --dry-run
   ```

#### Port Configuration

The application runs on port `13215` internally. This port is:

- Not exposed externally (only accessible via localhost)
- Mapped from the Docker container's port 3000
- Proxied through Apache on port 443 (HTTPS)

#### Security Considerations

- SSL/TLS encryption is enforced on port 443
- The application is only accessible via HTTPS
- Internal port (13215) is not exposed to the internet
- Apache acts as a reverse proxy, providing an additional security layer

## Notes

- This configuration is specific to the production deployment on Oracle Cloud Infrastructure
- The internal port (13215) should match the port configured in Docker Compose
- SSL certificates must be renewed before expiration (Let's Encrypt certificates expire every 90 days)
