```
# Install Google Cloud SDK if you haven't already
# https://cloud.google.com/sdk/docs/install

# Login to your Google Cloud account
gcloud auth login

# Set your project ID
gcloud config set project super-mega-cool

# Create a storage bucket (must be globally unique)
gsutil mb -l us-central1 gs://super-mega-game-frontend

# Make the bucket publicly accessible
gsutil iam ch allUsers:objectViewer gs://super-mega-game-frontend

# Build your frontend
cd super_mega
npm run build

# Upload the built files to the bucket
gsutil -m cp -r dist/* gs://super-mega-game-frontend/
```

backend

```
# build the container
gcloud builds submit --tag gcr.io/super-mega-cool/super-mega-backend

# Deploy to Cloud Run with WebSocket support
gcloud run deploy super-mega-backend \
  --image gcr.io/super-mega-cool/super-mega-backend \
  --platform managed \
  --allow-unauthenticated \
  --port=8080 \
  --region=us-central1 \
  --min-instances=1 \
  --timeout=3600 \
  --cpu=1 \
  --memory=512Mi \
  --session-affinity


# Grant Cloud Build Editor role
gcloud projects add-iam-policy-binding super-mega-cool \
  --member="user:mrkameronkeller@gmail.com" \
  --role="roles/cloudbuild.builds.editor"

# Grant Storage Admin role (for uploading build artifacts)
gcloud projects add-iam-policy-binding super-mega-cool \
  --member="user:mrkameronkeller@gmail.com" \
  --role="roles/storage.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding super-mega-cool \
  --member="user:mrkameronkeller@gmail.com" \
  --role="roles/iam.serviceAccountUser"
```
