# Debug Environment Variables Not Loading

## Step 1: Verify the persistent .env file content

```bash
ssh ashok@your-server
cat /home/ashok/Badminton-App-Backend/.env
```

Make sure it shows:
```
JWT_SECRET=5ce9f71c05e339f23d13e5750462ebf3007abd4d7726c1e7307790081f1f7d6af4d0b3460504dbb02fdf20392129dc27b20a717494670fe6d470499e7e1a497a
VAPID_PUBLIC_KEY=BNy1u8QHEuL-eTEuX9qJiumrlGkI259FVLMdJ83lMEidGqAqSfFAMVekwuys9FZZUV6dUqHVYvxnI-U9A6IYUVU
VAPID_PRIVATE_KEY=NsduKOUdAzBuPrWam9CliCUwbHVH_pOuhQ-wZTvP_nk
```

## Step 2: Check where GitHub Actions is running

```bash
# Find the GitHub Actions work directory
find /home/ashok -name "docker-compose.yml" -type f 2>/dev/null
```

This will show you all locations where docker-compose.yml exists.

## Step 3: Check the .env in the actual work directory

```bash
# Go to the GitHub Actions runner work directory
cd /home/ashok/actions-runner/_work/badminton-backend/badminton-backend
# Or wherever your runner is

# Check if .env exists and what's in it
cat .env
```

## Step 4: Check what's actually in the running container

```bash
# Check environment variables in the running container
docker exec badminton-backend printenv | grep VAPID

# Should show:
# VAPID_PUBLIC_KEY=BNy1u8QHEuL...
# VAPID_PRIVATE_KEY=NsduKOUdAzBuPrWam...
```

If this is EMPTY or shows old values, the env file isn't being loaded.

## Step 5: Manually test the deployment process

```bash
# Go to the actual deployment directory
cd /home/ashok/actions-runner/_work/badminton-backend/badminton-backend

# Copy .env manually
cp /home/ashok/Badminton-App-Backend/.env .env

# Verify it was copied
cat .env | grep VAPID

# Restart without cache
docker-compose down
docker-compose up -d

# Check env vars again
docker exec badminton-backend printenv | grep VAPID
```

## Common Issues:

### Issue 1: Wrong work directory
The GitHub Actions might be running in a different directory than expected.

**Fix:** Find the actual directory and update the workflow path.

### Issue 2: .env copied but Docker uses old environment
Even after copying, Docker might have cached environment variables.

**Fix:** Full clean restart:
```bash
docker-compose down -v  # -v removes volumes too
docker-compose build --no-cache
docker-compose up -d
```

### Issue 3: .env file has wrong line endings or encoding
If you edited on Windows and copied to Linux, line endings might be wrong.

**Fix:** Convert line endings:
```bash
dos2unix /home/ashok/Badminton-App-Backend/.env
# or
sed -i 's/\r$//' /home/ashok/Badminton-App-Backend/.env
```

### Issue 4: The Dockerfile is copying .env into the image
Your Dockerfile has `COPY . .` which includes .env in the image. While docker-compose should override this, it might cause issues.

**Fix:** Add .env to .dockerignore so it's not copied into the image:

Create/edit `.dockerignore`:
```
.env
.env.*
node_modules
.git
```

## Quick Fix: Add debug output to workflow

Let me update your workflow to show what's happening...
