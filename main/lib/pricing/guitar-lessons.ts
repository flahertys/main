# Guitar Lesson Pricing Configuration
# Update these values to change lesson pricing across the application

export const LESSON_PRICING = {
  beginner: {
    pricePerSession: 50,
    packageOf4: 180,
    title: "Start Your Journey",
    level: "Beginner Package"
  },
  intermediate: {
    pricePerSession: 10,  // Changed from $75 to $10
    packageOf4: 40,       // Changed from $270 to $40
    title: "Level Up Your Skills",
    level: "Intermediate"
  },
  advanced: {
    pricePerSession: 50,  // Changed from $100 to $50
    packageOf4: 200,      // Changed from $360 to $200
    title: "Master the Craft",
    level: "Advanced"
  }
};

export default LESSON_PRICING;

