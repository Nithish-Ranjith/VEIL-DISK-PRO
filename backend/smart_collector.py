import subprocess
import json
import logging

logger = logging.getLogger(__name__)

def get_smart_data(device_path: str = "/dev/disk0"):
    """
    Run smartctl to get SMART data from a local drive.
    Returns a dictionary of raw SMART values keyed by 'smart_X'.
    """
    try:
        # Check if smartctl exists
        # In a real deployment, we'd ensure this path or use 'smartctl' from PATH
        cmd = ["smartctl", "-j", "-a", device_path]
        
        # Run command
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.warning(f"smartctl returned non-zero exit code: {result.returncode}")
            # Smartctl returns bitmask exit codes, so non-zero isn't always fatal 
            # but usually implies some issue or just "disk failing" status.
            
        output = result.stdout
        if not output:
             logger.error("smartctl returned no output")
             return None

        data = json.loads(output)
        
        # Parse ATA SMART attributes
        smart_values = {}
        
        # Handle different smartctl output formats (ATA vs NVMe)
        # For this MVP, we focus on ATA/SATA attributes as defined in our model
        if 'ata_smart_attributes' in data:
            table = data['ata_smart_attributes']['table']
            for item in table:
                id_ = item.get('id')
                raw = item.get('raw', {}).get('value', 0)
                smart_values[f"smart_{id_}"] = raw
        
        elif 'nvme_smart_health_information_log' in data:
            # NVMe mapping (different IDs, simplified for demo)
            nvme = data['nvme_smart_health_information_log']
            smart_values['smart_5'] = nvme.get('media_errors', 0)
            smart_values['smart_194'] = nvme.get('temperature', 0)
            smart_values['smart_9'] = nvme.get('power_on_hours', 0)
            smart_values['smart_12'] = nvme.get('power_cycles', 0)
            # Map others if possible or leave 0
            
        return smart_values

    except FileNotFoundError:
        logger.error("smartctl not found. Please install smartmontools.")
        return None
    except json.JSONDecodeError:
        logger.error("Failed to decode smartctl JSON output.")
        return None
    except Exception as e:
        logger.error(f"Error running smartctl: {e}")
        return None

if __name__ == "__main__":
    # Test run
    data = get_smart_data()
    if data:
        print("SMART Data Retrieved:")
        print(json.dumps(data, indent=2))
    else:
        print("Failed to retrieve SMART data.")
