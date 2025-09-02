# 🚀 PulseHR Setup Guide

## ✅ What's Already Done
- Database schema created and tables set up
- All React components built and ready
- Assessment system fully implemented
- Analytics dashboard complete

## 🔧 What You Need to Do Now

### 1. **Set Up Environment Variables**
Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_BUCKET=your-bucket-name
```

**To get these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the URL and anon key

### 2. **Test the System**

#### **Admin Access:**
1. Go to `/admin/login` in your app
2. Use credentials: `admin` / `admin123`
3. You'll be redirected to the admin dashboard

#### **Employee Access:**
1. Go to `/employee` in your app
2. Generate an employee ID
3. Complete onboarding form
4. Access assessment center

### 3. **Create Your First Assessment**

1. **Login as Admin** (`/admin/login`)
2. **Go to Assessments tab**
3. **Click "Create Assessment"**
4. **Fill in details:**
   - Title: "Basic Skills Test"
   - Type: "Skills Assessment"
   - Duration: 30 minutes
   - Passing Score: 70%
   - Questions: 10
5. **Add Questions:**
   - Click "Manage Questions"
   - Add questions with options
   - Set correct answers

### 4. **Test Employee Flow**

1. **Create Employee ID** (`/employee`)
2. **Complete Onboarding** (all 10 steps)
3. **Take Assessment** (Assessment Center tab)
4. **View Results** and analytics

## 🎯 **Quick Test Steps**

### **Step 1: Admin Setup**
```bash
# 1. Set environment variables
# 2. Start your app
npm run dev

# 3. Go to /admin/login
# 4. Login with admin/admin123
```

### **Step 2: Create Assessment**
```bash
# 1. In Admin Dashboard > Assessments
# 2. Click "Create Assessment"
# 3. Fill basic details
# 4. Add 3-5 questions
# 5. Activate assessment
```

### **Step 3: Test Employee**
```bash
# 1. Go to /employee
# 2. Generate employee ID
# 3. Complete onboarding
# 4. Take assessment
# 5. Check results
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **"Supabase not configured" Error**
- Check your `.env` file exists
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
- Restart your dev server after changing .env

#### **"Failed to load assessments" Error**
- Check database tables were created
- Verify Supabase connection
- Check browser console for specific errors

#### **Admin login not working**
- Clear browser localStorage
- Check if admin route is `/admin` not `/admin/dashboard`
- Verify login component is working

#### **Employee onboarding issues**
- Check employee table exists
- Verify onboarding table structure
- Check for required field validation

### **Database Verification:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check sample data
SELECT * FROM assessments LIMIT 5;
SELECT * FROM employees LIMIT 5;
```

## 📊 **What You Should See After Setup**

### **Admin Dashboard:**
- 5 tabs: Dashboard, Employees, Assessments, Documents, Analytics
- Employee count display
- Quick action buttons
- Assessment management interface

### **Employee Portal:**
- Employee ID generation
- 10-step onboarding form
- Assessment center access
- Progress tracking

### **Assessment System:**
- Create/edit assessments
- Multiple question types
- Automated scoring
- Performance analytics

## 🎉 **Success Indicators**

✅ **Admin can login and access dashboard**  
✅ **Admin can create assessments**  
✅ **Employee can generate ID and complete onboarding**  
✅ **Employee can take assessments**  
✅ **Analytics show data and metrics**  
✅ **Database tables contain data**  

## 🆘 **Need Help?**

### **Check These First:**
1. **Environment Variables** - `.env` file exists and has correct values
2. **Database Tables** - All tables created successfully
3. **Browser Console** - Any JavaScript errors
4. **Network Tab** - API calls to Supabase

### **Common Solutions:**
- **Restart dev server** after changing .env
- **Clear browser cache** and localStorage
- **Check Supabase project** is active and accessible
- **Verify table structure** matches schema

---

## 🚀 **You're Almost There!**

The system is **100% built and ready** - you just need to:
1. ✅ **Set environment variables** (5 minutes)
2. ✅ **Test admin login** (2 minutes)  
3. ✅ **Create first assessment** (10 minutes)
4. ✅ **Test employee flow** (15 minutes)

**Total setup time: ~30 minutes** to have a fully working HR assessment system! 🎯

Let me know if you hit any specific errors and I'll help you resolve them!
