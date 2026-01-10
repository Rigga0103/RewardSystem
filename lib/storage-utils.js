// Local Storage utilities for coupon management

export const storageUtils = {
  // Get all coupons from localStorage
  getCoupons: () => {
    try {
      const coupons = localStorage.getItem("coupons")
      return coupons ? JSON.parse(coupons) : []
    } catch (error) {
      console.error("Error reading coupons from localStorage:", error)
      return []
    }
  },

  // Save coupons to localStorage
  saveCoupons: (coupons) => {
    try {
      localStorage.setItem("coupons", JSON.stringify(coupons))
      return true
    } catch (error) {
      console.error("Error saving coupons to localStorage:", error)
      return false
    }
  },

  // Clear all coupons
  clearCoupons: () => {
    try {
      localStorage.removeItem("coupons")
      return true
    } catch (error) {
      console.error("Error clearing coupons from localStorage:", error)
      return false
    }
  },

  // Find a coupon by code
  findCoupon: (couponCode) => {
    const coupons = storageUtils.getCoupons()
    return coupons.find((coupon) => coupon.code === couponCode)
  },

  // Redeem a coupon
  redeemCoupon: (couponCode, userDetails) => {
    const coupons = storageUtils.getCoupons()
    const couponIndex = coupons.findIndex((coupon) => coupon.code === couponCode)

    if (couponIndex === -1) {
      return {
        success: false,
        message: "Invalid coupon code. Please check and try again.",
      }
    }

    const coupon = coupons[couponIndex]

    if (coupon.status === "used") {
      return {
        success: false,
        message: "This coupon has already been used and cannot be redeemed again.",
      }
    }

    // Mark coupon as used
    coupons[couponIndex] = {
      ...coupon,
      status: "used",
      claimedBy: userDetails.name,
      claimedAt: new Date().toISOString(),
      userDetails: userDetails,
    }

    storageUtils.saveCoupons(coupons)

    return {
      success: true,
      message: "Coupon redeemed successfully!",
      rewardAmount: coupon.rewardAmount,
      coupon: coupons[couponIndex],
    }
  },

  // Get statistics
  getStatistics: () => {
    const coupons = storageUtils.getCoupons()
    const totalCoupons = coupons.length
    const usedCoupons = coupons.filter((c) => c.status === "used").length
    const unusedCoupons = coupons.filter((c) => c.status === "unused").length
    const totalRewards = coupons.filter((c) => c.status === "used").reduce((sum, c) => sum + c.rewardAmount, 0)

    return {
      totalCoupons,
      usedCoupons,
      unusedCoupons,
      totalRewards,
    }
  },

  // Get recent redemptions
  getRecentRedemptions: (limit = 10) => {
    const coupons = storageUtils.getCoupons()
    return coupons
      .filter((c) => c.status === "used")
      .sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt))
      .slice(0, limit)
  },
}
