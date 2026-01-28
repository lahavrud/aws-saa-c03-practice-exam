/**
 * User-facing messages and easter egg content
 */

const Messages = (function() {
    'use strict';
    
    return {
        // Easter egg loading messages
        easterEggMessages: [
            // Sergey (Infrastructure & Network)
            "Configuring Sergey Groups to block unauthorized traffic...",
            "Uploading data to Simple Sergey Service (S3)...",
            "Encrypting traffic with Sergey-Side Encryption...",
            "Checking Sergey-Net connectivity...",
            
            // Netzi (Management & Rules)
            "Routing packets through the Netzi Gateway...",
            "Checking permissions in Netzi ACLs...",
            "Calculating monthly costs in the Netzi Billing Console...",
            "Requesting approval from Netzi Organizations root account...",
            
            // Manny (Automation & Identity)
            "Authenticating via IA-Manny...",
            "Compiling Manny-fests...",
            "Debugging Python.manny scripts...",
            "Establishing a Manny-to-Manny database relationship...",
            
            // Dor (Connectivity & Containers)
            "Establishing Direct Dor-nect connection...",
            "Spinning up Dor-cker containers...",
            "Opening a Back-Dor for emergency access...",
            "Resolving DNS queries via Route Dor-3...",
            
            // Lahav (Serverless & Speed)
            "Invoking Lahav-da serverless functions...",
            "Caching content at Lahav Locations...",
            "Warming up Lahav-da cold starts...",
            "Scaling up with Auto-Lahav-ling Groups...",
            
            // Jonathan (Formats, NAT & JIT)
            "Parsing valid Jonathan-SON policy documents...",
            "Routing private traffic via the Jo-NAT-han Gateway...",
            "Granting Jonathan-in-Time administrative access...",
            "Validating the Jonathan Well-Architected Framework...",
            "Exporting CloudFormation templates to Jonathan-SON...",
            
            // Ilay & Eyal (High Availability & Redundancy)
            "Balancing traffic with Ilay-stic Load Balancer...",
            "Replicating data across Eyal-ability Zones...",
            "Syncing Ilay & Eyal Active-Active cluster...",
            "Allocating Ilay-stic IPs for dynamic resources...",
            "Taking snapshots for Eyal-astic Block Store..."
        ],
        
        // Error messages
        errors: {
            questionsLoadFailed: 'Failed to load questions. Please check your connection and refresh the page.',
            questionsLoadFromCache: 'Loaded questions from cache. Some features may be limited.',
            questionsLoadFromCacheError: 'Loaded questions from cache due to connection error.',
            signInFailed: 'Failed to sign in. Please check your connection and try again.',
            signInNotAvailable: 'Google Sign-In is not available. Please check Firebase configuration.',
            offlineMode: 'Running in offline mode. Some features may be limited.'
        }
    };
})();
