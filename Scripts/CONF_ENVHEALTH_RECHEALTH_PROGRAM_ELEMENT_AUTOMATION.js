{
	  "EnvHealth/Rec Health/Spa/*": {
	    "ApplicationSubmitAfter": [
	      {
	    	  "metadata": {
	              "description": "To automate the fee by program element",
	              "operators": {}
	            },
	            "criteria": {},
	            "preScript": "",
	        "action": {
	          "assessFees": 
	            {
	              "feeSchedule": "EH_SPA",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  },
	  "EnvHealth/Rec Health/Spa/Renewal": {
	    "ConvertToRealCAPAfter": [
	      {
	    	  "metadata": {
	              "description": "To automate the fee by program element",
	              "operators": {}
	            },
	            "criteria": {},
	            "preScript": "",
	        "action": {
	          "assessFees": 
	            {
	              "feeSchedule": "EH_SPA",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }	         
	        }
	      }
	    ]
	  }
,

  "EnvHealth/Rec Health/Pool/*": {
    "ApplicationSubmitAfter": [
      {
    	  "metadata": {
              "description": "To automate the fee by program element",
              "operators": {}
            },
            "criteria": {},
            "preScript": "",
        "action": {
          "assessFees":
            {
              "feeSchedule": "EH_POOL",
              "feeQuantity": 1,
              "feeInvoice": "Y",
              "feePeriod": "FINAL"
            }          
        }
      }
    ]
  },
  "EnvHealth/Rec Health/Pool/Renewal": {
    "ConvertToRealCAPAfter": [
      {
    	  "metadata": {
              "description": "To automate the fee by program element",
              "operators": {}
            },
            "criteria": {},
            "preScript": "",
        "action": {
          "assessFees":
            {
              "feeSchedule": "EH_POOL",
              "feeQuantity": 1,
              "feeInvoice": "Y",
              "feePeriod": "FINAL"
            }          
        }
      }
    ]
  }
}