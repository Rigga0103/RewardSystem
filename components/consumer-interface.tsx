// "use client"

// import { useState, ChangeEvent, FormEvent } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { storageUtils } from "@/lib/storage-utils"
// import type { FormData, Message, Coupon } from "@/components/types/coupon"

// export default function ConsumerInterface() {
//   const [formData, setFormData] = useState<FormData>({
//     couponCode: "",
//     name: "",
//     phone: "",
//     email: "",
//   })
//   const [message, setMessage] = useState<Message>({ type: "", content: "" })
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

//   const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
//     const { name, value } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   const validateForm = (): boolean => {
//     if (!formData.couponCode.trim()) {
//       setMessage({ type: "error", content: "Please enter a coupon code" })
//       return false
//     }
//     if (!formData.name.trim()) {
//       setMessage({ type: "error", content: "Please enter your name" })
//       return false
//     }
//     if (!formData.phone.trim()) {
//       setMessage({ type: "error", content: "Please enter your phone number" })
//       return false
//     }
//     if (!formData.email.trim()) {
//       setMessage({ type: "error", content: "Please enter your email" })
//       return false
//     }
//     if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
//       setMessage({ type: "error", content: "Please enter a valid email address" })
//       return false
//     }
//     if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
//       setMessage({ type: "error", content: "Please enter a valid 10-digit phone number" })
//       return false
//     }
//     return true
//   }

//   const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
//     e.preventDefault()
//     setIsSubmitting(true)
//     setMessage({ type: "", content: "" })

//     if (!validateForm()) {
//       setIsSubmitting(false)
//       return
//     }

//     // Simulate processing delay
//     setTimeout(() => {
//       const result = storageUtils.redeemCoupon(formData.couponCode, {
//         name: formData.name,
//         phone: formData.phone,
//         email: formData.email,
//       })

//       if (result.success) {
//         setMessage({
//           type: "success",
//           content: `Congratulations! Your coupon has been successfully redeemed. ₹${result.rewardAmount} reward has been credited to your account.`,
//         })
//         setFormData({
//           couponCode: "",
//           name: "",
//           phone: "",
//           email: "",
//         })
//       } else {
//         setMessage({
//           type: "error",
//           content: result.message,
//         })
//       }
//       setIsSubmitting(false)
//     }, 1000)
//   }

//   const simulateScan = (): void => {
//     // Simulate scanning a barcode - get a random unused coupon
//     const coupons = storageUtils.getCoupons()
//     const unusedCoupons = coupons.filter((c: Coupon) => c.status === "unused")

//     if (unusedCoupons.length > 0) {
//       const randomCoupon = unusedCoupons[Math.floor(Math.random() * unusedCoupons.length)]
//       setFormData((prev) => ({
//         ...prev,
//         couponCode: randomCoupon.code,
//       }))
//       setMessage({
//         type: "success",
//         content: "Coupon scanned successfully! Please fill in your details below.",
//       })
//     } else {
//       setMessage({
//         type: "error",
//         content: "No unused coupons available for scanning simulation.",
//       })
//     }
//   }

//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
//       <Card>
//         <CardHeader className="text-center">
//           <CardTitle className="text-2xl">Claim Your Reward</CardTitle>
//           <p className="text-muted-foreground">
//             Scan your coupon barcode or enter the code manually to claim your ₹100 reward
//           </p>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {/* Simulate Barcode Scan */}
//             <div className="text-center">
//               <Button onClick={simulateScan} variant="outline" className="mb-4 bg-transparent">
//                 📱 Simulate Barcode Scan
//               </Button>
//               <p className="text-sm text-muted-foreground">
//                 Click above to simulate scanning a barcode (for demo purposes)
//               </p>
//             </div>

//             {/* Redemption Form */}
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <Label htmlFor="couponCode">Coupon Code *</Label>
//                 <Input
//                   id="couponCode"
//                   name="couponCode"
//                   value={formData.couponCode}
//                   onChange={handleInputChange}
//                   placeholder="Enter coupon code (e.g., WIN100-00001)"
//                   className="font-mono"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="name">Full Name *</Label>
//                 <Input
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   placeholder="Enter your full name"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="phone">Phone Number *</Label>
//                 <Input
//                   id="phone"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   placeholder="Enter your 10-digit phone number"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="email">Email Address *</Label>
//                 <Input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder="Enter your email address"
//                 />
//               </div>

//               <Button type="submit" className="w-full" disabled={isSubmitting}>
//                 {isSubmitting ? "Processing..." : "Claim Reward"}
//               </Button>
//             </form>

//             {/* Message Display */}
//             {message.content && (
//               <Alert className={message.type === "error" ? "border-destructive" : "border-green-500"}>
//                 <AlertDescription className={message.type === "error" ? "text-destructive" : "text-green-700"}>
//                   {message.content}
//                 </AlertDescription>
//               </Alert>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Instructions */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg">How to Use</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-2 text-sm text-muted-foreground">
//             <p>1. Scan the barcode on your coupon using the simulate button above</p>
//             <p>2. Fill in your personal details in the form</p>
//             <p>3. Click "Claim Reward" to redeem your coupon</p>
//             <p>4. Each coupon can only be used once</p>
//             <p>5. You will receive a confirmation message upon successful redemption</p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }






"use client"

import { useState, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { storageUtils } from "@/lib/storage-utils"
import type { FormData, Message, Coupon } from "@/components/types/coupon"

export default function PremiumConsumerInterface() {
  const [formData, setFormData] = useState<FormData>({
    couponCode: "",
    name: "",
    phone: "",
    email: "",
  })
  const [message, setMessage] = useState<Message>({ type: "", content: "" })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.couponCode.trim()) {
      setMessage({ type: "error", content: "Please enter a coupon code" })
      return false
    }
    if (!formData.name.trim()) {
      setMessage({ type: "error", content: "Please enter your name" })
      return false
    }
    if (!formData.phone.trim()) {
      setMessage({ type: "error", content: "Please enter your phone number" })
      return false
    }
    if (!formData.email.trim()) {
      setMessage({ type: "error", content: "Please enter your email" })
      return false
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setMessage({ type: "error", content: "Please enter a valid email address" })
      return false
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      setMessage({ type: "error", content: "Please enter a valid 10-digit phone number" })
      return false
    }
    return true
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: "", content: "" })

    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    // Simulate processing delay
    setTimeout(() => {
      const result = storageUtils.redeemCoupon(formData.couponCode, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      })

      if (result.success) {
        setMessage({
          type: "success",
          content: `Congratulations! Your coupon has been successfully redeemed. ₹${result.rewardAmount} reward has been credited to your account.`,
        })
        setFormData({
          couponCode: "",
          name: "",
          phone: "",
          email: "",
        })
      } else {
        setMessage({
          type: "error",
          content: result.message,
        })
      }
      setIsSubmitting(false)
    }, 1000)
  }

  const simulateScan = (): void => {
    // Simulate scanning a barcode - get a random unused coupon
    const coupons = storageUtils.getCoupons()
    const unusedCoupons = coupons.filter((c: Coupon) => c.status === "unused")

    if (unusedCoupons.length > 0) {
      const randomCoupon = unusedCoupons[Math.floor(Math.random() * unusedCoupons.length)]
      setFormData((prev) => ({
        ...prev,
        couponCode: randomCoupon.code,
      }))
      setMessage({
        type: "success",
        content: "Coupon scanned successfully! Please fill in your details below.",
      })
    } else {
      setMessage({
        type: "error",
        content: "No unused coupons available for scanning simulation.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gray-50 to-stone-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
    

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
          
          <CardHeader className="text-center px-6 sm:px-8 py-8 bg-gradient-to-b from-gray-50/50 to-white">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Coupon Redemption
            </CardTitle>
            <p className="text-gray-600 text-sm leading-relaxed">
              Scan your barcode or enter the code manually to claim your ₹100 reward
            </p>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8">
            <div className="space-y-8">
              
              {/* Scan Section */}
              <div className="text-center py-8 px-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-xl mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-.01M12 12v4m6-7h2M6 20h2m2-6h2m2 0h2M6 9h2m2-6h2m2 0h2M6 4h2m6 7h2m-8 0h2m0 0h2"/>
                  </svg>
                </div>
                <Button 
                  onClick={simulateScan}
                  className="mb-4 px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Simulate Barcode Scan
                </Button>
                <p className="text-xs text-gray-500">
                  Click above to simulate scanning a barcode for demo purposes
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="couponCode" className="text-sm font-semibold text-gray-700">
                    Coupon Code *
                  </Label>
                  <Input
                    id="couponCode"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="Enter coupon code (e.g., WIN100-00001)"
                    className="font-mono border-gray-200 rounded-xl py-4 px-4 bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 text-center tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="border-gray-200 rounded-xl py-4 px-4 bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your 10-digit phone number"
                      className="border-gray-200 rounded-xl py-4 px-4 bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="border-gray-200 rounded-xl py-4 px-4 bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    "Claim Reward"
                  )}
                </Button>
              </form>

              {/* Messages */}
              {message.content && (
                <Alert className={`rounded-xl border-0 shadow-lg ${
                  message.type === "error" 
                    ? "bg-red-50 border-red-200" 
                    : "bg-green-50 border-green-200"
                }`}>
                  <AlertDescription className={`font-medium text-center py-1 ${
                    message.type === "error" 
                      ? "text-red-700" 
                      : "text-green-700"
                  }`}>
                    {message.content}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="px-6 sm:px-8 py-6">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              How to Use
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 pb-6">
            <div className="space-y-4">
              {[
                "Scan the barcode on your coupon using the simulate button above",
                "Fill in your personal details in the form",
                "Click \"Claim Reward\" to redeem your coupon",
                "Each coupon can only be used once",
                "You will receive a confirmation message upon successful redemption"
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 shadow-sm">
                    {index + 1}
                  </div>
                  <p className="leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Secure • Fast • Reliable
          </p>
        </div>
      </div>
    </div>
  )
}