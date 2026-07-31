/**
 * Calibration Layer — Phase 5
 *
 * Sits between the raw provider data and TelemetryService.ingest().
 * Applies per-sensor calibration correction before data enters the pipeline:
 *
 *   correctedValue = (rawValue + offset) * multiplier
 *
 * All downstream consumers (dashboards, Kili AI, Alerts, Reports) receive
 * standardized, corrected values. Raw values are preserved in iotTelemetry metadata.
 */

import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { iotSensors } from "../../../drizzle/schema";

export interface CalibrationResult {
  rawValue: number;
  correctedValue: number;
  offset: number;
  multiplier: number;
  wasCalibrated: boolean;
}

class CalibrationLayer {
  /**
   * Apply sensor calibration to a raw reading.
   * Falls back to rawValue if sensor has no calibration or DB is unavailable.
   */
  async apply(sensorId: number, rawValue: number): Promise<CalibrationResult> {
    try {
      const db = await getDb();
      if (!db) {
        return this.passthrough(rawValue);
      }

      const [sensor] = await db.select({
        calibrationOffset:     iotSensors.calibrationOffset,
        calibrationMultiplier: iotSensors.calibrationMultiplier,
        calibrationStatus:     iotSensors.calibrationStatus,
      })
        .from(iotSensors)
        .where(eq(iotSensors.id, sensorId))
        .limit(1);

      if (!sensor) {
        return this.passthrough(rawValue);
      }

      const offset     = sensor.calibrationOffset     ?? 0;
      const multiplier = sensor.calibrationMultiplier ?? 1;

      // No calibration needed — identity pass-through
      if (offset === 0 && multiplier === 1) {
        return this.passthrough(rawValue);
      }

      const correctedValue = Math.round((rawValue + offset) * multiplier * 10000) / 10000;

      return {
        rawValue,
        correctedValue,
        offset,
        multiplier,
        wasCalibrated: true,
      };
    } catch (err) {
      console.error("[CalibrationLayer] Error applying calibration:", err);
      return this.passthrough(rawValue);
    }
  }

  private passthrough(rawValue: number): CalibrationResult {
    return {
      rawValue,
      correctedValue: rawValue,
      offset: 0,
      multiplier: 1,
      wasCalibrated: false,
    };
  }
}

export const calibrationLayer = new CalibrationLayer();
