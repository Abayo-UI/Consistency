import HealthProfile from "../models/HealthProfile.js";

function computeBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10; // one decimal place
}

export async function createOrUpdateHealthProfile(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const {
      height,
      currentWeight,
      dateOfBirth,
      bloodGroup,
      restingHeartRate,
      notes,
    } = request.body;

    const bmi = computeBmi(currentWeight, height);

    let profile = await HealthProfile.findOne({ userId });
    if (profile) {
      // update fields provided
      if (height !== undefined) profile.height = height;
      if (currentWeight !== undefined) profile.currentWeight = currentWeight;
      if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
      if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup;
      if (restingHeartRate !== undefined) profile.restingHeartRate = restingHeartRate;
      if (notes !== undefined) profile.notes = notes;
      profile.bmi = bmi || profile.bmi;
      await profile.save();
      return response.status(200).json(profile);
    }

    profile = new HealthProfile({
      userId,
      height,
      currentWeight,
      dateOfBirth,
      bloodGroup,
      restingHeartRate,
      notes,
      bmi,
    });

    await profile.save();
    return response.status(201).json(profile);
  } catch (e) {
    console.error("createOrUpdateHealthProfile error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyHealthProfile(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const profile = await HealthProfile.findOne({ userId });
    if (!profile) return response.status(404).json({ error: "Health profile not found" });
    return response.status(200).json(profile);
  } catch (e) {
    console.error("getMyHealthProfile error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function getHealthProfileById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { id } = request.params;
    const profile = await HealthProfile.findById(id);
    if (!profile) return response.status(404).json({ error: "Health profile not found" });
    if (String(profile.userId) !== String(userId)) return response.status(403).json({ error: "Forbidden" });
    return response.status(200).json(profile);
  } catch (e) {
    console.error("getHealthProfileById error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function updateHealthProfile(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { id } = request.params;
    const profile = await HealthProfile.findById(id);
    if (!profile) return response.status(404).json({ error: "Health profile not found" });
    if (String(profile.userId) !== String(userId)) return response.status(403).json({ error: "Forbidden" });

    const updatable = ["height", "currentWeight", "dateOfBirth", "bloodGroup", "restingHeartRate", "notes"];
    updatable.forEach((key) => {
      if (request.body[key] !== undefined) profile[key] = request.body[key];
    });

    // recompute bmi if weight or height changed
    if (request.body.height !== undefined || request.body.currentWeight !== undefined) {
      profile.bmi = computeBmi(profile.currentWeight, profile.height);
    }

    await profile.save();
    return response.status(200).json(profile);
  } catch (e) {
    console.error("updateHealthProfile error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteHealthProfile(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { id } = request.params;
    const profile = await HealthProfile.findById(id);
    if (!profile) return response.status(404).json({ error: "Health profile not found" });
    if (String(profile.userId) !== String(userId)) return response.status(403).json({ error: "Forbidden" });

    await HealthProfile.findByIdAndDelete(id);
    return response.status(200).json({ message: "Health profile deleted" });
  } catch (e) {
    console.error("deleteHealthProfile error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}
