/**
 * SENTINEL-DISK Pro — Data Transformers
 * 
 * Logic to transform raw backend responses into frontend-friendly objects.
 * Extracted from App.jsx to keep components clean.
 */

export function transformBackendData(res) {
    if (!res) return null;
    const { drive, health, coordinator, cumulative_impact, intervention } = res;

    return {
        smart_status: {
            passed: drive.smart_passed, // true, false, or null (unknown)
            available: drive.smart && Object.keys(drive.smart).length > 0,
            is_simulated: drive.is_simulated ?? true,
        },

        smart_current: {
            smart_5: drive.smart?.smart_5 ?? 0,
            smart_187: drive.smart?.smart_187 ?? 0,
            smart_197: drive.smart?.smart_197 ?? 0,
            smart_198: drive.smart?.smart_198 ?? 0,
            smart_188: drive.smart?.smart_188 ?? 0,
            smart_194: drive.smart?.smart_194 ?? null,
            smart_9: drive.smart?.smart_9 ?? 0,
            smart_12: drive.smart?.smart_12 ?? 0,
        },

        health: {
            score: health.current_score,
            current_score: health.current_score,
            failure_probability: health.failure_probability,
            risk_level: health.risk_level,
            days_to_failure: health.days_to_failure,
            trend: health.trend,
            key_factors: health.key_factors || [],
        },

        compression: {
            mode: coordinator.current_mode || 'monitoring',
            write_reduction_pct: coordinator.compression_result?.total_write_reduction
                ? (coordinator.compression_result.total_write_reduction * 100).toFixed(1)
                : '0.0',
            compressible_data_gb: coordinator.compression_result?.total_compressible_gb || 0,
            recommendation: coordinator.recommendation || 'System healthy',
            intervention_triggered: coordinator.intervention_triggered || false,
            total_files: coordinator.compression_result?.total_files || 0,
            compressed_files: coordinator.compression_result?.compressed_files || 0,
            total_size_gb: coordinator.compression_result?.total_size_gb || 0,
            compressed_size_gb: coordinator.compression_result?.compressed_size_gb || 0,
            space_saved_gb: coordinator.compression_result?.space_saved_gb || 0,
            by_file_type: coordinator.compression_result?.by_file_type || [],
            write_ops_history: coordinator.compression_result?.write_ops_history || [],
            recommendations: coordinator.compression_result?.recommendations || [],
        },

        life_extension: {
            total_interventions: cumulative_impact?.total_interventions || 0,
            total_days_extended: cumulative_impact?.total_days_extended || 0,
            baseline_remaining_days: health.days_to_failure || 0,
            current_remaining_days: (health.days_to_failure || 0) + (cumulative_impact?.total_days_extended || 0),
            interventions: cumulative_impact?.interventions || [],
        },

        coordinator_status: {
            mode: coordinator.current_mode,
            last_intervention: intervention?.date_human || 'Never',
            total_interventions: cumulative_impact?.total_interventions || 0,
            data_source: coordinator.data_source || 'simulated',
        },

        drive_meta: {
            is_simulated: drive.is_simulated ?? true,
            model: drive.model || 'Unknown',
            serial: drive.serial || 'Unknown',
        },
    };
}
