// Dummy data for Fleet Performance Reports
// Used as fallback when API returns empty or during development

const DUMMY_DRIVERS = [
  { id: 'd1', name: 'Rajesh Kumar', phone: '+91 98765 43210', vehiclePlate: 'UP 32 AC 4481', vehicleModel: 'Maruti Ertiga', safetyScore: 94, previousScore: 91, totalTrips: 28, harshBraking: 1, overspeeding: 0, swerving: 0, phoneUsage: 0, fatigue: 0, harshAcceleration: 0, mainIssue: null },
  { id: 'd2', name: 'Amit Singh', phone: '+91 87654 32109', vehiclePlate: 'DL 01 AB 1234', vehicleModel: 'Toyota Innova', safetyScore: 91, previousScore: 88, totalTrips: 32, harshBraking: 2, overspeeding: 1, swerving: 0, phoneUsage: 0, fatigue: 0, harshAcceleration: 1, mainIssue: null },
  { id: 'd3', name: 'Suresh Yadav', phone: '+91 76543 21098', vehiclePlate: 'UP 78 BT 9012', vehicleModel: 'Hyundai Creta', safetyScore: 88, previousScore: 85, totalTrips: 24, harshBraking: 2, overspeeding: 1, swerving: 1, phoneUsage: 0, fatigue: 0, harshAcceleration: 0, mainIssue: null },
  { id: 'd4', name: 'Vikram Patel', phone: '+91 65432 10987', vehiclePlate: 'DL 03 CD 5678', vehicleModel: 'Mahindra XUV700', safetyScore: 82, previousScore: 80, totalTrips: 20, harshBraking: 3, overspeeding: 2, swerving: 1, phoneUsage: 1, fatigue: 0, harshAcceleration: 1, mainIssue: 'Overspeeding' },
  { id: 'd5', name: 'Pradeep Sharma', phone: '+91 54321 09876', vehiclePlate: 'UP 80 EF 3456', vehicleModel: 'Tata Nexon', safetyScore: 78, previousScore: 75, totalTrips: 18, harshBraking: 4, overspeeding: 3, swerving: 2, phoneUsage: 1, fatigue: 1, harshAcceleration: 2, mainIssue: 'Harsh Braking' },
  { id: 'd6', name: 'Manoj Verma', phone: '+91 43210 98765', vehiclePlate: 'UP 32 GH 7890', vehicleModel: 'Maruti Dzire', safetyScore: 74, previousScore: 78, totalTrips: 22, harshBraking: 5, overspeeding: 3, swerving: 1, phoneUsage: 2, fatigue: 0, harshAcceleration: 1, mainIssue: 'Harsh Braking' },
  { id: 'd7', name: 'Ravi Tiwari', phone: '+91 32109 87654', vehiclePlate: 'DL 05 IJ 2345', vehicleModel: 'Honda City', safetyScore: 68, previousScore: 72, totalTrips: 15, harshBraking: 6, overspeeding: 4, swerving: 3, phoneUsage: 2, fatigue: 1, harshAcceleration: 3, mainIssue: 'Overspeeding' },
  { id: 'd8', name: 'Deepak Gupta', phone: '+91 21098 76543', vehiclePlate: 'UP 65 KL 6789', vehicleModel: 'Kia Seltos', safetyScore: 62, previousScore: 65, totalTrips: 19, harshBraking: 7, overspeeding: 5, swerving: 2, phoneUsage: 3, fatigue: 2, harshAcceleration: 2, mainIssue: 'Phone Usage' },
  { id: 'd9', name: 'Sanjay Mishra', phone: '+91 10987 65432', vehiclePlate: 'UP 32 MN 0123', vehicleModel: 'Maruti Brezza', safetyScore: 55, previousScore: 60, totalTrips: 14, harshBraking: 8, overspeeding: 6, swerving: 4, phoneUsage: 3, fatigue: 2, harshAcceleration: 4, mainIssue: 'Harsh Braking' },
  { id: 'd10', name: 'Arun Dubey', phone: '+91 09876 54321', vehiclePlate: 'DL 08 OP 4567', vehicleModel: 'Hyundai Venue', safetyScore: 45, previousScore: 50, totalTrips: 12, harshBraking: 10, overspeeding: 8, swerving: 5, phoneUsage: 4, fatigue: 3, harshAcceleration: 5, mainIssue: 'Overspeeding' },
  { id: 'd11', name: 'Karan Chauhan', phone: '+91 98761 23456', vehiclePlate: 'UP 14 QR 8901', vehicleModel: 'Tata Punch', safetyScore: 38, previousScore: 42, totalTrips: 10, harshBraking: 12, overspeeding: 9, swerving: 6, phoneUsage: 5, fatigue: 4, harshAcceleration: 6, mainIssue: 'Phone Usage' },
  { id: 'd12', name: 'Naveen Rawat', phone: '+91 87651 23456', vehiclePlate: 'UP 32 ST 2345', vehicleModel: 'Maruti Alto', safetyScore: 28, previousScore: 35, totalTrips: 8, harshBraking: 15, overspeeding: 11, swerving: 8, phoneUsage: 6, fatigue: 5, harshAcceleration: 7, mainIssue: 'Harsh Braking' },
];

const DUMMY_WEEKLY_TREND = [
  { week: 'Week 1', label: 'May 5-11', avgScore: 64 },
  { week: 'Week 2', label: 'May 12-18', avgScore: 67 },
  { week: 'Week 3', label: 'May 19-25', avgScore: 69 },
  { week: 'Week 4', label: 'May 26-Jun 1', avgScore: 72 },
];

const DUMMY_RISK_EVENTS = [
  { type: 'harsh_braking', label: 'Harsh Braking', count: 73, color: 'red' },
  { type: 'overspeeding', label: 'Overspeeding', count: 53, color: 'red' },
  { type: 'swerving', label: 'Swerving', count: 33, color: 'orange' },
  { type: 'harsh_acceleration', label: 'Harsh Acceleration', count: 32, color: 'orange' },
  { type: 'phone_usage', label: 'Phone Usage While Driving', count: 27, color: 'orange' },
  { type: 'fatigue', label: 'Fatigue Detected', count: 18, color: 'gray' },
  { type: 'pothole', label: 'Pothole Events', count: 14, color: 'blue' },
];

function computeScoreDistribution(drivers) {
  const bands = { excellent: 0, good: 0, average: 0, highRisk: 0 };
  for (const d of drivers) {
    if (d.safetyScore >= 85) bands.excellent++;
    else if (d.safetyScore >= 70) bands.good++;
    else if (d.safetyScore >= 50) bands.average++;
    else bands.highRisk++;
  }
  return bands;
}

function computeSummary(drivers) {
  const scores = drivers.map((d) => d.safetyScore);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const prevScores = drivers.map((d) => d.previousScore);
  const prevAvg = Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length);
  const totalTrips = drivers.reduce((sum, d) => sum + d.totalTrips, 0);
  const totalHighRisk = drivers.reduce((sum, d) => sum + d.harshBraking + d.overspeeding + d.swerving, 0);
  const activeDrivers = drivers.filter((d) => d.totalTrips > 0).length;

  return {
    safarScore: avgScore,
    scoreTrend: avgScore - prevAvg,
    totalTrips,
    highRiskEvents: totalHighRisk,
    activeDrivers,
    totalDrivers: drivers.length,
  };
}

export function getDummyReportData() {
  const drivers = DUMMY_DRIVERS.map((d) => ({
    ...d,
    scoreTrend: d.safetyScore - d.previousScore,
  }));

  return {
    drivers,
    summary: computeSummary(drivers),
    scoreDistribution: computeScoreDistribution(drivers),
    weeklyTrend: DUMMY_WEEKLY_TREND,
    riskEvents: DUMMY_RISK_EVENTS,
    totalRiskEvents: DUMMY_RISK_EVENTS.reduce((sum, e) => sum + e.count, 0),
  };
}

export function getDummyDriverDetail(driverId) {
  const driver = DUMMY_DRIVERS.find((d) => d.id === driverId);
  if (!driver) return null;

  const weeklyScores = [
    { week: 'Week 1', score: Math.max(0, driver.safetyScore - 12) },
    { week: 'Week 2', score: Math.max(0, driver.safetyScore - 7) },
    { week: 'Week 3', score: driver.previousScore },
    { week: 'Week 4', score: driver.safetyScore },
  ];

  const trips = Array.from({ length: Math.min(driver.totalTrips, 8) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const score = Math.max(20, Math.min(100, driver.safetyScore + Math.floor(Math.random() * 20) - 10));
    const distance = Math.floor(Math.random() * 40) + 5;
    return {
      id: `trip-${i}`,
      date: date.toLocaleDateString('en-IN'),
      startTime: `${8 + Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      endTime: `${12 + Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      distance: `${distance} km`,
      score,
    };
  });

  const bestTrip = trips.reduce((best, t) => (t.score > best.score ? t : best), trips[0]);
  const worstTrip = trips.reduce((worst, t) => (t.score < worst.score ? t : worst), trips[0]);

  return {
    ...driver,
    scoreTrend: driver.safetyScore - driver.previousScore,
    weeklyScores,
    trips,
    bestTrip,
    worstTrip,
    events: {
      harshBraking: driver.harshBraking,
      overspeeding: driver.overspeeding,
      swerving: driver.swerving,
      phoneUsage: driver.phoneUsage,
      fatigue: driver.fatigue,
      harshAcceleration: driver.harshAcceleration,
    },
    suggestions: driver.safetyScore < 70
      ? [
          `Reduce ${(driver.mainIssue || 'harsh braking').toLowerCase()} events by 30% — score could improve by ~15 points.`,
          'Focus on maintaining steady speed on highways — overspeeding events add up quickly.',
          'Avoid phone usage during active driving — each event reduces score by 3-5 points.',
        ]
      : [
          'Maintain current driving patterns — consistency is key to high scores.',
          'Minor speed adjustments on city roads can push score above 90.',
        ],
  };
}
