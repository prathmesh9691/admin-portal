import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

interface OnboardingData {
  // Employee Details
  employee_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  marital_status: string;
  number_of_kids: number;
  
  // Contact Information
  personal_email: string;
  contact_number: string;
  current_address: string;
  current_city: string;
  state: string;
  
  // Job Details
  joining_date: string;
  reporting_manager: string;
  office_time: string;
  office_department: string;
  job_status: string;
  job_title: string;
  
  // Identification Documents
  aadhar_card: string;
  pan_number: string;
  driving_license: string;
  
  // Emergency Contact
  emergency_contact_person: string;
  emergency_contact_number: string;
  emergency_relationship: string;
  
  // Health Information
  blood_type: string;
  has_health_problem: boolean;
  health_problem_details: string;
  
  // Banking Information
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  
  // Nominee Details
  nominee_name: string;
  nominee_relation: string;
  nominee_gender: string;
  nominee_date_of_birth: string;
  nominee_aadhar_number: string;
  
  // Previous Employment
  previous_company_name: string;
  graduation_degree: string;
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function OnboardingForm({ employeeId, onComplete }: { employeeId: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    employee_name: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    marital_status: "",
    number_of_kids: 0,
    personal_email: "",
    contact_number: "",
    current_address: "",
    current_city: "",
    state: "",
    joining_date: "",
    reporting_manager: "",
    office_time: "",
    office_department: "",
    job_status: "",
    job_title: "",
    aadhar_card: "",
    pan_number: "",
    driving_license: "",
    emergency_contact_person: "",
    emergency_contact_number: "",
    emergency_relationship: "",
    blood_type: "",
    has_health_problem: false,
    health_problem_details: "",
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    nominee_name: "",
    nominee_relation: "",
    nominee_gender: "",
    nominee_date_of_birth: "",
    nominee_aadhar_number: "",
    previous_company_name: "",
    graduation_degree: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = getSupabase();

  const steps = [
    { title: "Employee Details", description: "Basic personal information" },
    { title: "Contact Information", description: "Address and contact details" },
    { title: "Job Details", description: "Employment information" },
    { title: "Identification", description: "ID documents" },
    { title: "Emergency Contact", description: "Emergency contact person" },
    { title: "Health Information", description: "Health and medical details" },
    { title: "Banking Information", description: "Bank account details" },
    { title: "Nominee Details", description: "Nominee information (optional)" },
    { title: "Previous Employment", description: "Previous work experience" },
    { title: "Education", description: "Educational background" },
  ];

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (!supabase) throw new Error("Supabase not configured");

      // Save onboarding data
      const { error } = await supabase.from("employee_onboarding").insert({
        employee_id: employeeId,
        ...formData,
        completed: true,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Onboarding completed successfully!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save onboarding data");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Employee Details
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_name">Employee Name *</Label>
                <Input
                  id="employee_name"
                  value={formData.employee_name}
                  onChange={(e) => updateFormData("employee_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateFormData("date_of_birth", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => updateFormData("nationality", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status *</Label>
                <Select value={formData.marital_status} onValueChange={(value) => updateFormData("marital_status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.marital_status === "married" && (
                <div className="space-y-2">
                  <Label htmlFor="number_of_kids">Number of Kids</Label>
                  <Input
                    id="number_of_kids"
                    type="number"
                    min="0"
                    value={formData.number_of_kids}
                    onChange={(e) => updateFormData("number_of_kids", parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 1: // Contact Information
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="personal_email">Personal Email ID *</Label>
                <Input
                  id="personal_email"
                  type="email"
                  value={formData.personal_email}
                  onChange={(e) => updateFormData("personal_email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input
                  id="contact_number"
                  value={formData.contact_number}
                  onChange={(e) => updateFormData("contact_number", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="current_address">Current Address *</Label>
                <Textarea
                  id="current_address"
                  value={formData.current_address}
                  onChange={(e) => updateFormData("current_address", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_city">Current City *</Label>
                <Input
                  id="current_city"
                  value={formData.current_city}
                  onChange={(e) => updateFormData("current_city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => updateFormData("state", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2: // Job Details
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joining_date">Joining Date *</Label>
                <Input
                  id="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => updateFormData("joining_date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporting_manager">Reporting Manager *</Label>
                <Input
                  id="reporting_manager"
                  value={formData.reporting_manager}
                  onChange={(e) => updateFormData("reporting_manager", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_time">Office Time *</Label>
                <Input
                  id="office_time"
                  value={formData.office_time}
                  onChange={(e) => updateFormData("office_time", e.target.value)}
                  placeholder="e.g., 9:00 AM - 6:00 PM"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_department">Office Department *</Label>
                <Input
                  id="office_department"
                  value={formData.office_department}
                  onChange={(e) => updateFormData("office_department", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_status">Job Status *</Label>
                <Select value={formData.job_status} onValueChange={(value) => updateFormData("job_status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => updateFormData("job_title", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3: // Identification Documents
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhar_card">Aadhar Card Number *</Label>
                <Input
                  id="aadhar_card"
                  value={formData.aadhar_card}
                  onChange={(e) => updateFormData("aadhar_card", e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number *</Label>
                <Input
                  id="pan_number"
                  value={formData.pan_number}
                  onChange={(e) => updateFormData("pan_number", e.target.value)}
                  placeholder="ABCDE1234F"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driving_license">Driving License Number</Label>
                <Input
                  id="driving_license"
                  value={formData.driving_license}
                  onChange={(e) => updateFormData("driving_license", e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Emergency Contact
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_person">Emergency Contact Person *</Label>
                <Input
                  id="emergency_contact_person"
                  value={formData.emergency_contact_person}
                  onChange={(e) => updateFormData("emergency_contact_person", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_number">Emergency Contact Number *</Label>
                <Input
                  id="emergency_contact_number"
                  value={formData.emergency_contact_number}
                  onChange={(e) => updateFormData("emergency_contact_number", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_relationship">Relationship *</Label>
                <Input
                  id="emergency_relationship"
                  value={formData.emergency_relationship}
                  onChange={(e) => updateFormData("emergency_relationship", e.target.value)}
                  placeholder="e.g., Spouse, Parent, Sibling"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 5: // Health Information
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_type">Blood Type *</Label>
                <Select value={formData.blood_type} onValueChange={(value) => updateFormData("blood_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_health_problem"
                    checked={formData.has_health_problem}
                    onCheckedChange={(checked) => updateFormData("has_health_problem", checked as boolean)}
                  />
                  <Label htmlFor="has_health_problem">Any Health Problem?</Label>
                </div>
              </div>
              {formData.has_health_problem && (
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="health_problem_details">Health Problem Details</Label>
                  <Textarea
                    id="health_problem_details"
                    value={formData.health_problem_details}
                    onChange={(e) => updateFormData("health_problem_details", e.target.value)}
                    placeholder="Please describe your health condition..."
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Banking Information
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_holder_name">Account Holder Name *</Label>
                <Input
                  id="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={(e) => updateFormData("account_holder_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name *</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => updateFormData("bank_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => updateFormData("account_number", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC Code *</Label>
                <Input
                  id="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={(e) => updateFormData("ifsc_code", e.target.value)}
                  placeholder="e.g., SBIN0001234"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 7: // Nominee Details
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nominee_name">Nominee Name</Label>
                <Input
                  id="nominee_name"
                  value={formData.nominee_name}
                  onChange={(e) => updateFormData("nominee_name", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominee_relation">Relation</Label>
                <Input
                  id="nominee_relation"
                  value={formData.nominee_relation}
                  onChange={(e) => updateFormData("nominee_relation", e.target.value)}
                  placeholder="e.g., Spouse, Child, Parent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominee_gender">Gender</Label>
                <Select value={formData.nominee_gender} onValueChange={(value) => updateFormData("nominee_gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominee_date_of_birth">Date of Birth</Label>
                <Input
                  id="nominee_date_of_birth"
                  type="date"
                  value={formData.nominee_date_of_birth}
                  onChange={(e) => updateFormData("nominee_date_of_birth", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominee_aadhar_number">Aadhar Number</Label>
                <Input
                  id="nominee_aadhar_number"
                  value={formData.nominee_aadhar_number}
                  onChange={(e) => updateFormData("nominee_aadhar_number", e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        );

      case 8: // Previous Employment
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="previous_company_name">Previous Company Name</Label>
                <Input
                  id="previous_company_name"
                  value={formData.previous_company_name}
                  onChange={(e) => updateFormData("previous_company_name", e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        );

      case 9: // Education
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduation_degree">Graduation Degree</Label>
                <Input
                  id="graduation_degree"
                  value={formData.graduation_degree}
                  onChange={(e) => updateFormData("graduation_degree", e.target.value)}
                  placeholder="e.g., B.Tech, BBA, B.Sc"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Employee Onboarding Form</CardTitle>
        <CardDescription>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Complete Onboarding"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
