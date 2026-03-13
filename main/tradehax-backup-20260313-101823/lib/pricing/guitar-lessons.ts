// Guitar Lesson Pricing Configuration
// Update these values to change lesson pricing across the application

export const LESSON_PRICING = {
  beginner: {
    pricePerSession: 50,
    packageOf4: 200,
    title: "Start Your Journey",
    level: "Beginner Package"
  },
  intermediate: {
    pricePerSession: 50,  // $50 per session (same as beginner)
    packageOf4: 200,      // $200 for 4 lessons (4 × $50)
    title: "Level Up Your Skills",
    level: "Intermediate"
  },
  advanced: {
    pricePerSession: 50,  // $50 per session (same as beginner/intermediate)
    packageOf4: 200,      // $200 for 4 lessons (4 × $50)
    title: "Master the Craft",
    level: "Advanced"
  }
};

export default LESSON_PRICING;

