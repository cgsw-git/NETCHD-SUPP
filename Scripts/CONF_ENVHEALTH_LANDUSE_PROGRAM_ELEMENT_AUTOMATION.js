{
	  "EnvHealth/Land Use/Back flow Prevention/*": {
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
	              "feeSchedule": "EH_BACK_FLOW_PREVENTION",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  },
	   "EnvHealth/Land Use/Septic/*": {
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
	              "feeSchedule": "EH_ONSITE_WASTE_WATER",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  },
	   "EnvHealth/Land Use/Subdivision/*": {
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
	              "feeSchedule": "EH_SUBDIVISION",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  },
	   "EnvHealth/Land Use/Water Well/*": {
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
	              "feeSchedule": "EH_WATER_WELL",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  }
}