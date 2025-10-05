from datetime import datetime
from zoneinfo import ZoneInfo
import pytz

def ist_now():
    tz = pytz.timezone("Asia/Kolkata")
    return datetime.now(tz)
print(ist_now())