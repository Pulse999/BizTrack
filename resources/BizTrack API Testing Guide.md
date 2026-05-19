# BizTrack API Testing Guide
## Learn to Test APIs Before You Code

**Purpose:** Learn how to test the BizTrack authentication API using Postman  
**When to use this:** Day 8 - Before you start coding the login feature  
**Time needed:** 30-45 minutes  

---

## Why Test APIs First?

Before you write code to integrate with an API, you should:
- ✅ Understand exactly how it works
- ✅ See what data you get back
- ✅ Know what happens when it fails
- ✅ Test different scenarios

**Think of it like:** You wouldn't start cooking without tasting the ingredients first!

---

## Part 1: Install Postman (10 minutes)

### What is Postman?

Postman is a tool that lets you test APIs without writing code. You can:
- Send requests to any API
- See the responses
- Save your tests for later
- Share API tests with your team

### Download and Install

1. Go to: **https://www.postman.com/downloads/**
2. Download Postman for your operating system
3. Install it (no account needed for basic use)
4. Open Postman

**Alternative:** You can use the web version at **https://web.postman.co/** (requires account)

---

## Part 2: Test BizTrack Login API (20 minutes)

### Step 1: Create a New Request

1. Open Postman
2. Click **"New"** (top left)
3. Select **"HTTP Request"**
4. You'll see a blank request screen

---

### Step 2: Configure the Request

#### Set the Method
- Change the dropdown from **GET** to **POST**

#### Set the URL
Copy and paste this URL:
```
https://stage.biztrack.co.za/php/api/merchy_api/universal_login
```

---

### Step 3: Set Up the Request Body

1. Click the **"Body"** tab (below the URL)
2. Select **"x-www-form-urlencoded"** (radio button)
3. Add these key-value pairs:

| Key | Value |
|-----|-------|
| `Email` | `merchie111@biztrack.co.za` |
| `Password` | `BizPa$$9!!` |
| `DeviceType` | `1` |
| `DeviceID` | _(leave empty)_ |
| `Key` | `BizTrack@123#WebAPI` |
| `FirebaseToken` | _(leave empty)_ |
| `BuildVersion` | `1.0` |

**Important:** Make sure all keys are typed EXACTLY as shown (case-sensitive!)

---

### Step 4: Send the Request

1. Click the blue **"Send"** button (top right)
2. Wait 1-3 seconds
3. Look at the response below

---

### Step 5: Understand the Response

#### Successful Login (200 OK)

If everything worked, you'll see:

**Status:** `200 OK` (in green)

**Response Body:**
```json
{
  "code": 200,
  "message": "Success",
  "orderButtonsEnabled": false,
  "taskButtonsEnabled": false,
  "formBtnEnabled": false,
  "userTimezoneShortName": "SA",
  "userTimezoneName": "Africa/Johannesburg",
  "timezoneCountryCode": "ZA",
  "tblUser": {
    "UserID": 12492,
    "OnlineUserID": "12492",
    "FixedCompanyID": null,
    "Firstname": "Merchie",
    "Lastname": "Learning Platform",
    "Email": "merchie111@biztrack.co.za",
    "Password": "dw+WWyPP63b0nNTwbcbAknyQemcSamvZY2HxDT6QDPU=",
    "DateLastSynced": "2025-10-14 09:47:51.000",
    "DateLastModified": "2025-10-14 09:47:51.247"
  },
  "tblCompany": {
    "CompanyID": 8,
    "OnlineCompanyID": "8",
    "Name": "BizTrack Demo 1",
    "MaximumRangeInMeters": "150.0",
    "MaximumRangeInMetersNoGPS": "99999999",
    "DateLastModified": "2025-09-02 13:41:16.507",
    "TimeZone": "SA",
    "TimeZoneID": "1",
    "CompanyDataFreeURL": "https://stage.biztrack.co.za",
    "CompanyMapBoxURL": "https://api.mapbox.com"
  }
}
```

**What you need from this:**
- ✅ `tblUser.UserID` → This is the BizTrack user ID (12492)
- ✅ `tblUser.Firstname` → User's first name
- ✅ `tblUser.Lastname` → User's last name
- ✅ `tblUser.Email` → User's email
- ✅ `tblCompany.CompanyID` → Their company ID (8)
- ✅ `tblCompany.Name` → Their company name

**Note:** The `Password` field in the response is encrypted - ignore it!

---

### Step 6: Test Invalid Credentials

Let's see what happens when login fails:

1. Change the `Password` value to: `WrongPassword123`
2. Click **"Send"** again
3. Look at the response

You should see an error response (exact format may vary):
```json
{
  "code": 401,
  "message": "Invalid email or password"
}
```

**What this teaches you:**
- ❌ Your app needs to handle failed logins
- ❌ Show user-friendly error messages
- ❌ Don't expose technical details to users

---

## Part 3: Understanding the Data (10 minutes)

### Exercise: Map the API Response to Your Database

Look at the API response and identify what you need to store in your `users` table:

| API Field | Your Database Field | Notes |
|-----------|---------------------|-------|
| `tblUser.UserID` | `biztrack_user_id` | This links to BizTrack! |
| `tblUser.Email` | `email` | Unique identifier |
| `tblUser.Firstname` | `first_name` | Display name |
| `tblUser.Lastname` | `last_name` | Display name |
| `tblCompany.CompanyID` | `biztrack_company_id` | Company reference |
| _(not in API)_ | `is_admin` | You decide this |
| _(not in API)_ | `created_at` | Timestamp when created |
| _(not in API)_ | `last_login` | Update each login |

### What You DON'T Store:
❌ Password (BizTrack handles authentication)  
❌ Company details (just store the ID)  
❌ Token/session data from BizTrack  

---

## Part 4: Test Different Scenarios (10 minutes)

### Scenario 1: Test with Another User

Ask your mentor for another test account, or use the provided one:
- Try logging in
- Compare the response
- Note the different `UserID`

### Scenario 2: Test with Missing Fields

Try removing required fields to see what happens:
1. Remove the `Email` field
2. Send request
3. Observe error

This teaches you: **Always validate input before sending to API!**

### Scenario 3: Test with Wrong API Key

Change the `Key` value to: `WrongKey123`

This shows you what happens if configuration is wrong.

---

## Part 5: Save Your Request (5 minutes)

### Save for Later

1. Click **"Save"** (top right)
2. Create a new collection called: "BizTrack Learning Hub"
3. Name the request: "Login - Test Account"
4. Save it

Now you can run this test anytime!

### Share with Your Partner

1. Export the collection
2. Share with your coding partner
3. Both of you can test the API

---

## Part 6: Document Your Findings (10 minutes)

### Create a Test Report

In a text file or Google Doc, write:

**Test Date:** [Today's date]

**Test Account Used:**
- Email: merchie111@biztrack.co.za
- Status: ✅ Working

**Successful Response Fields:**
- UserID: 12492
- Name: Merchie Learning Platform
- Company: BizTrack Demo 1 (ID: 8)

**Error Scenarios Tested:**
- ✅ Invalid password → Returns error
- ✅ Missing email → Returns error
- ✅ Wrong API key → Returns error

**Data Mapping for Database:**
- biztrack_user_id ← UserID
- email ← Email
- first_name ← Firstname
- last_name ← Lastname
- biztrack_company_id ← CompanyID

**Questions for Mentor:**
1. [Any questions you have]
2. [Anything unclear]

---

## Common Issues & Solutions

### Problem: "Could not get any response"
**Cause:** Network issue or wrong URL  
**Solution:**
- Check your internet connection
- Verify the URL is exactly: `https://stage.biztrack.co.za/php/api/merchy_api/universal_login`
- Make sure you're using `POST`, not `GET`

---

### Problem: "404 Not Found"
**Cause:** Wrong URL or API endpoint changed  
**Solution:**
- Double-check the URL
- Ask your mentor if API endpoint is still correct

---

### Problem: "401 Unauthorized"
**Cause:** Wrong credentials or wrong API key  
**Solution:**
- Verify Email and Password are correct
- Check that `Key` is exactly: `BizTrack@123#WebAPI`
- Make sure fields are in the **Body**, not **Params**

---

### Problem: Can't see response body
**Cause:** Wrong response format selected  
**Solution:**
- Click "Pretty" view (below response)
- Select "JSON" from dropdown

---

## Next Steps: From Postman to Code

Now that you understand the API, you're ready to code!

### In Python (Flask), you'll:

```python
import requests

# This is basically what Postman did!
response = requests.post(
    'https://stage.biztrack.co.za/php/api/merchy_api/universal_login',
    data={
        'Email': email_from_form,
        'Password': password_from_form,
        'DeviceType': '1',
        'DeviceID': '',
        'Key': 'BizTrack@123#WebAPI',
        'FirebaseToken': '',
        'BuildVersion': '1.0'
    }
)

# Check if successful
if response.status_code == 200:
    data = response.json()
    if data['code'] == 200:
        # Login successful!
        user_id = data['tblUser']['UserID']
        # ... create or update user in your database
```

---

## Testing Checklist

Before you start coding, make sure you:

- [ ] Successfully logged in with test account in Postman
- [ ] Understand the response structure
- [ ] Know which fields you need to store
- [ ] Tested error scenarios
- [ ] Saved the request in Postman
- [ ] Documented your findings
- [ ] Asked mentor any questions

---

## Pro Tips

💡 **Save everything** - Keep your Postman requests organized in collections

💡 **Test first, code second** - Always test the API before writing code

💡 **Document as you go** - Write notes about what you learn

💡 **Share with your partner** - Make sure both of you understand the API

💡 **Ask questions** - If anything is unclear, ask your mentor!

---

## Additional Resources

**Postman Learning:**
- Postman Documentation: https://learning.postman.com/
- Video: "How to use Postman" on YouTube

**API Testing Best Practices:**
- Always test happy path (success) and sad path (errors)
- Document your findings
- Test with different data

**Python Requests Library:**
- Once you understand the API, you'll use the `requests` library in Python
- It works just like Postman, but in code!

---

## Reflection Questions

After testing the API, discuss with your partner:

1. What information does BizTrack give us about the user?
2. What do we need to store in our database?
3. How should we handle failed login attempts?
4. What if the BizTrack API is down? How should our app respond?
5. Do we need to sync user data regularly, or just at login?

---

**Congratulations!** You now understand how to test and integrate with the BizTrack API! 🎉

**Next:** Start coding your login feature on Day 8.

---

**Remember:** Testing APIs in Postman before coding saves hours of debugging later!
