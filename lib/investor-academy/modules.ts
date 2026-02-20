/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

export type AcademyDifficulty = "beginner" | "intermediate" | "advanced";

export type AcademyQuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type AcademyModule = {
  id: string;
  title: string;
  summary: string;
  difficulty: AcademyDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  haxReward: number;
  lessons: string[];
  quiz: AcademyQuizQuestion[];
};

export const investorAcademyModules: AcademyModule[] = [
  {
    id: "market-foundations",
    title: "Market Foundations",
    summary: "Understand risk, position sizing, and why surviving matters more than winning one trade.",
    difficulty: "beginner",
    estimatedMinutes: 12,
    xpReward: 120,
    haxReward: 10,
    lessons: [
      "Why drawdown control beats hype chasing",
      "How position size changes your long-term outcome",
      "Diversification across stock and crypto themes",
    ],
    quiz: [
      {
        id: "mf-1",
        prompt: "What is the primary purpose of position sizing?",
        choices: [
          "To maximize trade frequency",
          "To control downside risk per idea",
          "To avoid using stop losses",
          "To copy large institutional trades",
        ],
        answerIndex: 1,
        explanation: "Position sizing limits damage from a single wrong idea and protects account longevity.",
      },
      {
        id: "mf-2",
        prompt: "A diversified simulation portfolio should generally include:",
        choices: [
          "Only highest-volatility assets",
          "Only assets with social buzz",
          "Multiple uncorrelated sectors/themes",
          "Only one conviction asset",
        ],
        answerIndex: 2,
        explanation: "Uncorrelated exposure reduces concentrated risk when one theme underperforms.",
      },
    ],
  },
  {
    id: "ai-signal-literacy",
    title: "AI Signal Literacy",
    summary: "Learn how to interpret confidence scores, false positives, and regime changes in AI predictions.",
    difficulty: "intermediate",
    estimatedMinutes: 15,
    xpReward: 180,
    haxReward: 15,
    lessons: [
      "Confidence is not certainty",
      "Common causes of false-positive market signals",
      "How to grade a signal after the fact",
    ],
    quiz: [
      {
        id: "asl-1",
        prompt: "An AI signal with 82% confidence means:",
        choices: [
          "The outcome is guaranteed",
          "The model believes this setup is favorable, not certain",
          "The trade should be fully sized",
          "No risk controls are needed",
        ],
        answerIndex: 1,
        explanation: "Confidence reflects probability estimates from model context, not guaranteed outcomes.",
      },
      {
        id: "asl-2",
        prompt: "Best post-trade learning workflow is:",
        choices: [
          "Ignore losing setups",
          "Only save winning snapshots",
          "Label setup, thesis, result, and regime context",
          "Change rules after every trade",
        ],
        answerIndex: 2,
        explanation: "Consistent tagging creates useful feedback loops for model and human learning.",
      },
    ],
  },
  {
    id: "flow-and-whales",
    title: "Flow + Whale Pattern Recognition",
    summary: "Practice reading unusual activity, premium spikes, and sentiment shifts without executing real trades.",
    difficulty: "advanced",
    estimatedMinutes: 18,
    xpReward: 260,
    haxReward: 20,
    lessons: [
      "Interpreting unusual volume versus open interest",
      "Spotting likely hedges versus directional conviction",
      "Building simulated playbooks from historical flow",
    ],
    quiz: [
      {
        id: "fw-1",
        prompt: "A sudden premium spike with weak follow-through most likely indicates:",
        choices: [
          "Guaranteed directional move",
          "Potential hedge or one-off block needing confirmation",
          "A no-brainer buy setup",
          "Immediate market reversal",
        ],
        answerIndex: 1,
        explanation: "Single events require confirmation from context, trend, and subsequent activity.",
      },
      {
        id: "fw-2",
        prompt: "In a learning simulator, your first response to a whale signal should be:",
        choices: [
          "Copy blindly",
          "Ignore all flow data",
          "Log the setup and test scenarios with risk assumptions",
          "Double simulated size to maximize XP",
        ],
        answerIndex: 2,
        explanation: "Simulation is for building disciplined process, not reflexive mimicry.",
      },
    ],
  },
];
