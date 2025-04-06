const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateFare = (distance) => {
  const rateStructure = {
    bike: { baseFare: 100, perKmRate: 150, minimumFare: 200 },
    auto: { baseFare: 200, perKmRate: 150, minimumFare: 300 },
    cabEconomy: { baseFare: 200, perKmRate: 250, minimumFare: 400 },
    cabPremium: { baseFare: 200, perKmRate: 300, minimumFare: 500 },
};

  const fareCalculation = (baseFare, perKmRate, minimumFare) => {
    const calculatedFare = baseFare + (distance * perKmRate);
    const maxFare = Math.max(calculatedFare, minimumFare);
    return Math.floor(maxFare / 10) * 10; // Redondeo hacia abajo al múltiplo de 10
};

  return {
    bike: fareCalculation(
      rateStructure.bike.baseFare,
      rateStructure.bike.perKmRate,
      rateStructure.bike.minimumFare
    ),
    auto: fareCalculation(
      rateStructure.auto.baseFare,
      rateStructure.auto.perKmRate,
      rateStructure.auto.minimumFare
    ),
    cabEconomy: fareCalculation(
      rateStructure.cabEconomy.baseFare,
      rateStructure.cabEconomy.perKmRate,
      rateStructure.cabEconomy.minimumFare
    ),
    cabPremium: fareCalculation(
      rateStructure.cabPremium.baseFare,
      rateStructure.cabPremium.perKmRate,
      rateStructure.cabPremium.minimumFare
    ),
  };
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = {
  calculateDistance,
  calculateFare,
  generateOTP,
};
