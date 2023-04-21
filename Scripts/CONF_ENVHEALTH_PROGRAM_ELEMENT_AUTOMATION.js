{
	"EnvHealth/Food/Cottage/Registration": {
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
	              "feeSchedule": "EH_COTTAGE_FOOD",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  },
	  
	  "EnvHealth/Food/Cottage/Registered": {
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
		              "feeSchedule": "EH_ENFORCEMENT_COMPLAINT",
		              "feeQuantity": 1,
		              "feeInvoice": "Y",
		              "feePeriod": "FINAL"
		            }
		        }
		      }
		    ]
		  },
	  
	  "EnvHealth/Enforcement/Complaint/NA": {
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
	              "feeSchedule": "EH_ENFORCEMENT_COMPLAINT",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  },
	    "EnvHealth/Vector/Complaint/NA": {
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
	              "feeSchedule": "EH_VECTOR_COMPLAINT",
	              "feeQuantity": 1,
	              "feeInvoice": "Y",
	              "feePeriod": "FINAL"
	            }
	        }
	      }
	    ]
	  }
}