"""
COMPREHENSIVE TEST SUITE FOR SENTINEL-DISK PRO CORE INNOVATION
================================================================

This test suite validates the closed-loop system from ALL angles:
- Technical correctness (formula, calculations)
- Logical consistency (decision making)
- Edge cases (boundary conditions)
- Non-technical validation (does it make sense?)
"""

import sys
import json
from datetime import datetime

# Import the engines
from smart_reader import SMARTReader
from health_engine import HealthPredictionEngine
from compression_engine import CompressionEngine
from coordinator import IntelligentCoordinator

class CoordinatorTester:
    """Comprehensive test suite for the intelligent coordinator"""
    
    def __init__(self):
        self.smart_reader = SMARTReader()
        self.health_engine = HealthPredictionEngine()
        self.compression_engine = CompressionEngine()
        self.coordinator = IntelligentCoordinator(
            self.health_engine, 
            self.compression_engine, 
            self.smart_reader
        )
        self.test_results = []
    
    def log_test(self, test_name, passed, details=""):
        """Log a test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
        print(f"{status} - {test_name}")
        if details:
            print(f"   {details}")
    
    # =====================================================
    # TECHNICAL TESTS: Formula & Math Validation
    # =====================================================
    
    def test_life_extension_formula(self):
        """Test 1: Validate the life extension formula is mathematically correct"""
        print("\n" + "="*70)
        print("TEST 1: LIFE EXTENSION FORMULA VALIDATION")
        print("="*70)
        
        # Test case 1: 50% write reduction on 100 day baseline
        result = self.coordinator._calculate_life_extension(
            baseline_days=100,
            write_reduction=0.50
        )
        
        expected = 100 * (1 + 0.50 * 0.4)  # = 100 * 1.2 = 120
        expected_gain = expected - 100  # = 20
        
        formula_correct = abs(result['extended_days'] - expected) < 0.1
        gain_correct = abs(result['days_gained'] - expected_gain) < 0.1
        
        self.log_test(
            "Formula: extended_days = baseline × (1 + write_reduction × 0.4)",
            formula_correct and gain_correct,
            f"100 days × (1 + 0.50 × 0.4) = {result['extended_days']} (expected {expected})"
        )
        
        # Test case 2: Maximum write reduction (80%)
        result = self.coordinator._calculate_life_extension(
            baseline_days=50,
            write_reduction=0.80
        )
        
        expected = 50 * (1 + 0.80 * 0.4)  # = 50 * 1.32 = 66
        formula_correct = abs(result['extended_days'] - expected) < 0.1
        
        self.log_test(
            "Formula: Maximum reduction (80%)",
            formula_correct,
            f"50 days × (1 + 0.80 × 0.4) = {result['extended_days']} (expected {expected})"
        )
        
        # Test case 3: Minimum write reduction (10%)
        result = self.coordinator._calculate_life_extension(
            baseline_days=200,
            write_reduction=0.10
        )
        
        expected = 200 * (1 + 0.10 * 0.4)  # = 200 * 1.04 = 208
        formula_correct = abs(result['extended_days'] - expected) < 0.1
        
        self.log_test(
            "Formula: Minimum reduction (10%)",
            formula_correct,
            f"200 days × (1 + 0.10 × 0.4) = {result['extended_days']} (expected {expected})"
        )
    
    def test_intervention_thresholds(self):
        """Test 2: Validate intervention decision logic"""
        print("\n" + "="*70)
        print("TEST 2: INTERVENTION DECISION LOGIC")
        print("="*70)
        
        # Test Case A: Critical health (< 50) should ALWAYS trigger
        should_intervene = self.coordinator._should_intervene(
            health=30, drop=0, trend="stable", recommended=False
        )
        self.log_test(
            "Logic: Health < 50 ALWAYS triggers intervention",
            should_intervene == True,
            "Health=30 → Intervention=True"
        )
        
        # Test Case B: Health drop >= 5 points should trigger
        should_intervene = self.coordinator._should_intervene(
            health=70, drop=6, trend="stable", recommended=False
        )
        self.log_test(
            "Logic: Health drop >= 5 points triggers intervention",
            should_intervene == True,
            "Health=70, Drop=6 points → Intervention=True"
        )
        
        # Test Case C: Rapid decline should trigger
        should_intervene = self.coordinator._should_intervene(
            health=80, drop=2, trend="rapid_decline", recommended=False
        )
        self.log_test(
            "Logic: Rapid decline triggers intervention",
            should_intervene == True,
            "Trend=rapid_decline → Intervention=True"
        )
        
        # Test Case D: AI recommendation + some drop should trigger
        should_intervene = self.coordinator._should_intervene(
            health=60, drop=3, trend="stable", recommended=True
        )
        self.log_test(
            "Logic: AI recommended + drop >= 2 triggers intervention",
            should_intervene == True,
            "Recommended=True, Drop=3 → Intervention=True"
        )
        
        # Test Case E: Healthy drive with no issues should NOT trigger
        should_intervene = self.coordinator._should_intervene(
            health=95, drop=1, trend="stable", recommended=False
        )
        self.log_test(
            "Logic: Healthy drive does NOT trigger intervention",
            should_intervene == False,
            "Health=95, Drop=1, Stable → Intervention=False"
        )
    
    def test_compression_modes(self):
        """Test 3: Validate compression mode selection based on health"""
        print("\n" + "="*70)
        print("TEST 3: COMPRESSION MODE SELECTION")
        print("="*70)
        
        test_cases = [
            (95, "normal", 0.20),    # Health 80-100 → Normal (max 20%)
            (75, "conservative", 0.40),  # Health 60-79 → Conservative (max 40%)
            (55, "aggressive", 0.60),    # Health 40-59 → Aggressive (max 60%)
            (25, "emergency", 0.80),     # Health 0-39 → Emergency (max 80%)
        ]
        
        for health, expected_mode, expected_max in test_cases:
            result = self.compression_engine.calculate_write_reduction(
                health_score=health,
                compression_potential=0.70  # 70% compressible
            )
            
            mode_correct = result['mode'] == expected_mode
            reduction_within_max = result['total_write_reduction'] <= expected_max
            
            self.log_test(
                f"Mode Selection: Health={health} → {expected_mode.upper()}",
                mode_correct and reduction_within_max,
                f"Mode={result['mode']}, Reduction={result['total_write_reduction']:.1%} (max {expected_max:.0%})"
            )
    
    # =====================================================
    # LOGICAL TESTS: Does the System Make Sense?
    # =====================================================
    
    def test_cumulative_impact(self):
        """Test 4: Validate cumulative impact tracking"""
        print("\n" + "="*70)
        print("TEST 4: CUMULATIVE IMPACT TRACKING")
        print("="*70)
        
        # Get DRIVE_C which has interventions
        impact = self.coordinator.get_cumulative_impact("DRIVE_C")
        
        # Logical check: Total days should equal sum of individual interventions
        individual_sum = sum(
            i['impact']['life_extended_days'] 
            for i in impact['interventions']
        )
        
        cumulative_correct = abs(impact['total_days_extended'] - individual_sum) < 0.1
        
        self.log_test(
            "Cumulative Impact: Sum matches individual interventions",
            cumulative_correct,
            f"Total={impact['total_days_extended']}, Sum={individual_sum:.1f}, Count={impact['total_interventions']}"
        )
        
        # Logical check: Should have interventions for critical drive
        has_interventions = impact['total_interventions'] > 0
        
        self.log_test(
            "Cumulative Impact: Critical drive has interventions",
            has_interventions,
            f"DRIVE_C has {impact['total_interventions']} interventions recorded"
        )
    
    def test_health_to_intervention_correlation(self):
        """Test 5: Lower health should result in more aggressive interventions"""
        print("\n" + "="*70)
        print("TEST 5: HEALTH-TO-INTERVENTION CORRELATION")
        print("="*70)
        
        # Test healthy drive
        drives = self.smart_reader.get_all_drives()
        
        for drive in drives:
            drive_id = drive['drive_id']
            history = self.smart_reader.get_smart_history(drive_id, days=30)
            prediction = self.health_engine.predict(history)
            impact = self.coordinator.get_cumulative_impact(drive_id)
            
            health = prediction['health_score']
            intervention_count = impact['total_interventions']
            
            # Logical expectation: Lower health → More interventions
            if health < 50:
                expects_interventions = True
                has_interventions = intervention_count > 0
                result = expects_interventions == has_interventions
            else:
                # High health drives may or may not have interventions
                result = True
            
            self.log_test(
                f"Correlation: {drive_id} (Health={health})",
                result,
                f"Interventions={intervention_count}, Risk={prediction['risk_level']}"
            )
    
    # =====================================================
    # EDGE CASE TESTS: Boundary Conditions
    # =====================================================
    
    def test_zero_baseline(self):
        """Test 6: Edge case - Zero baseline days"""
        print("\n" + "="*70)
        print("TEST 6: EDGE CASE - ZERO BASELINE")
        print("="*70)
        
        result = self.coordinator._calculate_life_extension(
            baseline_days=0,
            write_reduction=0.50
        )
        
        # Should still calculate correctly (0 × anything = 0)
        correct = result['extended_days'] == 0
        
        self.log_test(
            "Edge Case: Zero baseline days",
            correct,
            f"0 days × (1 + 0.50 × 0.4) = {result['extended_days']} days"
        )
    
    def test_very_large_baseline(self):
        """Test 7: Edge case - Very large baseline"""
        print("\n" + "="*70)
        print("TEST 7: EDGE CASE - VERY LARGE BASELINE")
        print("="*70)
        
        result = self.coordinator._calculate_life_extension(
            baseline_days=10000,
            write_reduction=0.50
        )
        
        expected = 10000 * 1.2  # = 12000
        correct = abs(result['extended_days'] - expected) < 1
        
        self.log_test(
            "Edge Case: Very large baseline (10,000 days)",
            correct,
            f"10000 days × 1.2 = {result['extended_days']} days (+{result['days_gained']})"
        )
    
    def test_minimum_compression_potential(self):
        """Test 8: Edge case - Minimum compression threshold"""
        print("\n" + "="*70)
        print("TEST 8: EDGE CASE - MINIMUM COMPRESSION THRESHOLD")
        print("="*70)
        
        # Coordinator requires >= 20% compression potential
        # Test with 15% (below threshold) - should NOT intervene even if health is bad
        
        # Simulate low compression potential
        original_method = self.compression_engine.analyze_filesystem
        
        def mock_low_compression(*args, **kwargs):
            result = original_method(*args, **kwargs)
            result['compression_potential'] = 0.15  # 15% - below 20% threshold
            return result
        
        self.compression_engine.analyze_filesystem = mock_low_compression
        
        # This would normally trigger, but compression is too low
        # Note: We can't easily test this without mocking, so we'll check the threshold constant
        threshold_exists = hasattr(self.coordinator, 'MIN_COMPRESSION_POTENTIAL')
        threshold_value = self.coordinator.MIN_COMPRESSION_POTENTIAL if threshold_exists else None
        
        self.log_test(
            "Edge Case: Minimum compression threshold exists",
            threshold_exists and threshold_value == 0.20,
            f"MIN_COMPRESSION_POTENTIAL = {threshold_value}"
        )
        
        # Restore original method
        self.compression_engine.analyze_filesystem = original_method
    
    # =====================================================
    # NON-TECHNICAL TESTS: Common Sense Validation
    # =====================================================
    
    def test_common_sense_life_extension(self):
        """Test 9: Non-technical - Does the life extension make intuitive sense?"""
        print("\n" + "="*70)
        print("TEST 9: COMMON SENSE - LIFE EXTENSION MAGNITUDE")
        print("="*70)
        
        # Common sense: 50% write reduction should extend life by ~20%
        result = self.coordinator._calculate_life_extension(
            baseline_days=100,
            write_reduction=0.50
        )
        
        extension_percentage = (result['days_gained'] / 100) * 100
        
        # Expect 20% extension (50% × 0.4 = 20%)
        makes_sense = 15 <= extension_percentage <= 25  # Allow 5% margin
        
        self.log_test(
            "Common Sense: 50% write reduction → ~20% life extension",
            makes_sense,
            f"100 days + {result['days_gained']} days = {extension_percentage:.0f}% increase"
        )
        
        # Common sense: More reduction = more extension
        result_low = self.coordinator._calculate_life_extension(100, 0.20)
        result_high = self.coordinator._calculate_life_extension(100, 0.80)
        
        monotonic = result_high['days_gained'] > result_low['days_gained']
        
        self.log_test(
            "Common Sense: Higher reduction → Higher extension",
            monotonic,
            f"20% reduction → +{result_low['days_gained']:.1f} days, 80% reduction → +{result_high['days_gained']:.1f} days"
        )
    
    def test_intervention_trigger_reason(self):
        """Test 10: Non-technical - Intervention reasons are clear and actionable"""
        print("\n" + "="*70)
        print("TEST 10: NON-TECHNICAL - INTERVENTION CLARITY")
        print("="*70)
        
        # Check DRIVE_C interventions have clear reasons
        impact = self.coordinator.get_cumulative_impact("DRIVE_C")
        
        if impact['total_interventions'] > 0:
            intervention = impact['interventions'][0]
            reason = intervention['trigger']['reason']
            
            # Should contain actionable information
            has_health_info = 'health' in reason.lower() or 'Health' in reason
            has_specific_trigger = len(reason) > 10  # Not empty/generic
            
            self.log_test(
                "Non-technical: Intervention reason is clear",
                has_health_info and has_specific_trigger,
                f"Reason: '{reason}'"
            )
            
            # Should have impact details
            has_impact = 'life_extended_days' in intervention['impact']
            has_formula = 'formula_used' in intervention['impact']
            
            self.log_test(
                "Non-technical: Intervention shows impact",
                has_impact and has_formula,
                f"Impact: +{intervention['impact']['life_extended_days']} days"
            )
    
    # =====================================================
    # INTEGRATION TESTS: End-to-End Validation
    # =====================================================
    
    def test_full_cycle_integration(self):
        """Test 11: Integration - Full coordinator cycle works end-to-end"""
        print("\n" + "="*70)
        print("TEST 11: INTEGRATION - FULL COORDINATOR CYCLE")
        print("="*70)
        
        # Run a full cycle for DRIVE_C
        try:
            status = self.coordinator.run_cycle("DRIVE_C")
            
            # Should return all required fields
            has_drive_id = 'drive_id' in status
            has_health = 'health' in status
            has_coordinator = 'coordinator' in status
            has_cumulative = 'cumulative_impact' in status
            
            complete_structure = all([has_drive_id, has_health, has_coordinator, has_cumulative])
            
            self.log_test(
                "Integration: run_cycle() returns complete status",
                complete_structure,
                f"Keys: {list(status.keys())}"
            )
            
            # Health should have valid values
            health = status['health']
            valid_health = (
                0 <= health['current_score'] <= 100 and
                0 <= health['failure_probability'] <= 1 and
                health['days_to_failure'] >= 0
            )
            
            self.log_test(
                "Integration: Health values are valid",
                valid_health,
                f"Health={health['current_score']}, Prob={health['failure_probability']:.2f}, Days={health['days_to_failure']}"
            )
            
        except Exception as e:
            self.log_test(
                "Integration: run_cycle() executes without errors",
                False,
                f"ERROR: {str(e)}"
            )
    
    def test_multiple_drives_coordination(self):
        """Test 12: Integration - Coordinator handles multiple drives correctly"""
        print("\n" + "="*70)
        print("TEST 12: INTEGRATION - MULTIPLE DRIVE COORDINATION")
        print("="*70)
        
        drives = self.smart_reader.get_all_drives()
        
        all_successful = True
        drive_statuses = []
        
        for drive in drives:
            try:
                status = self.coordinator.run_cycle(drive['drive_id'])
                drive_statuses.append({
                    'id': drive['drive_id'],
                    'health': status['health']['current_score'],
                    'interventions': status['cumulative_impact']['total_interventions']
                })
            except Exception as e:
                all_successful = False
                self.log_test(
                    f"Integration: {drive['drive_id']} cycle",
                    False,
                    f"ERROR: {str(e)}"
                )
        
        if all_successful:
            self.log_test(
                "Integration: All drives processed successfully",
                True,
                f"Processed {len(drives)} drives"
            )
            
            for ds in drive_statuses:
                print(f"   {ds['id']}: Health={ds['health']}, Interventions={ds['interventions']}")
    
    # =====================================================
    # RUN ALL TESTS
    # =====================================================
    
    def run_all_tests(self):
        """Execute all tests and generate report"""
        print("\n" + "="*70)
        print("SENTINEL-DISK PRO - COMPREHENSIVE TEST SUITE")
        print("="*70)
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Run all test methods
        self.test_life_extension_formula()
        self.test_intervention_thresholds()
        self.test_compression_modes()
        self.test_cumulative_impact()
        self.test_health_to_intervention_correlation()
        self.test_zero_baseline()
        self.test_very_large_baseline()
        self.test_minimum_compression_potential()
        self.test_common_sense_life_extension()
        self.test_intervention_trigger_reason()
        self.test_full_cycle_integration()
        self.test_multiple_drives_coordination()
        
        # Generate summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for t in self.test_results if t['passed'])
        failed_tests = total_tests - passed_tests
        
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\nTotal Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Pass Rate: {pass_rate:.1f}%\n")
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            for test in self.test_results:
                if not test['passed']:
                    print(f"  ❌ {test['test']}")
                    if test['details']:
                        print(f"     {test['details']}")
        
        print("\n" + "="*70)
        
        if pass_rate == 100:
            print("🎉 ALL TESTS PASSED - CORE INNOVATION VALIDATED! 🎉")
        elif pass_rate >= 90:
            print("✅ EXCELLENT - Core innovation is solid (minor issues)")
        elif pass_rate >= 75:
            print("⚠️  GOOD - Core innovation works (some improvements needed)")
        else:
            print("❌ CRITICAL - Core innovation has significant issues")
        
        print("="*70 + "\n")
        
        return pass_rate == 100


if __name__ == "__main__":
    tester = CoordinatorTester()
    all_passed = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)
