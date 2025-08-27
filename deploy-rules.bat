@echo off
echo Deploying Firestore rules...
firebase deploy --only firestore:rules
echo Rules deployment completed.
pause
