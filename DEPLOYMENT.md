# DoogleOnline Deployment Guide

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Domain name (optional)
- SSL certificate (for HTTPS)

## Quick Deploy on Replit

1. **Database Setup**
   - The PostgreSQL database is already configured
   - Environment variables are automatically set

2. **Deploy the Application**
   - Click the "Deploy" button in your Replit interface
   - The application will be automatically built and deployed
   - Your app will be available at: `https://your-repl-name.your-username.replit.app`

3. **Admin Access**
   - Access admin dashboard at: `/admin/login`
   - Default credentials: admin / admin123
   - **Important**: Change admin credentials immediately after deployment

## Manual Deployment

### 1. Environment Setup

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
PORT=5000
```

### 2. Database Migration

```bash
npm run db:push
npm run db:seed  # Optional: Add sample data
```

### 3. Build and Start

```bash
npm run build
npm start
```

## Production Checklist

### Security
- [ ] Change default admin credentials
- [ ] Set strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Set up rate limiting
- [ ] Review environment variables

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure database connection pooling
- [ ] Enable caching where appropriate
- [ ] Monitor application performance

### Monitoring
- [ ] Set up error logging
- [ ] Configure uptime monitoring
- [ ] Set up database backups
- [ ] Monitor disk space and memory usage

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `NODE_ENV` | Environment (development/production) | Yes | development |
| `PORT` | Server port | No | 5000 |
| `ADMIN_USERNAME` | Admin login username | No | admin |
| `ADMIN_PASSWORD` | Admin login password | No | admin123 |

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check database server is running
   - Ensure firewall allows connections

2. **Port Already in Use**
   - Change PORT environment variable
   - Kill existing processes on the port

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Performance Issues

1. **Slow Database Queries**
   - Review query performance
   - Add database indexes if needed
   - Consider connection pooling

2. **High Memory Usage**
   - Monitor for memory leaks
   - Restart application periodically
   - Optimize large data queries

## Backup and Recovery

### Database Backup

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Database Restore

```bash
psql $DATABASE_URL < backup.sql
```

## Support

For deployment support:
1. Check application logs
2. Review database connectivity
3. Verify environment configuration
4. Contact system administrator if needed