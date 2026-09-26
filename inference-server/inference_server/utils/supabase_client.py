"""
Supabase client for the inference server.
"""
from supabase import create_client, Client
from inference_server.config import settings
from typing import Optional


# Global client instance
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Get or create the Supabase client.
    Uses service role key if available (for server-side operations),
    otherwise falls back to anon key.
    """
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    if not settings.supabase_url or not (settings.supabase_service_role_key or settings.supabase_anon_key):
        return None
    
    key = settings.supabase_service_role_key or settings.supabase_anon_key
    _supabase_client = create_client(settings.supabase_url, key)
    return _supabase_client


def insert_scan_result(
    skin_type: str,
    skin_confidence: float,
    acne_severity: str,
    acne_confidence: float,
    user_id: Optional[str] = None,
) -> Optional[dict]:
    """
    Insert a scan result into the scans table.
    
    Args:
        skin_type: Predicted skin type label
        skin_confidence: Confidence score for skin type
        acne_severity: Predicted acne severity label
        acne_confidence: Confidence score for acne severity
        user_id: Optional user ID from auth token
        
    Returns:
        The inserted record or None if Supabase is not configured
    """
    client = get_supabase_client()
    if client is None:
        return None
    
    data = {
        "skin_type": skin_type,
        "skin_confidence": skin_confidence,
        "acne_severity": acne_severity,
        "acne_confidence": acne_confidence,
    }
    
    if user_id:
        data["user_id"] = user_id
    
    try:
        result = client.table("scans").insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.getLogger(__name__).error(f"Failed to insert scan result: {e}")
        return None