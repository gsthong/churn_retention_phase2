# Rebuild Comprehensive Model
import sys
import matplotlib
import matplotlib.pyplot as plt

import random

import numpy as np
from numpy import extract

import pandas as pd

from google.colab import drive
from IPython.display import display

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

drive.mount('/content/drive',force_remount=True)
Customers=pd.read_excel('/content/drive/MyDrive/AISC_Project/Telco_customer_churn.xlsx')

class Notebook:
  # Reason Categorization
  Voluntary=[
      "Competitor made better offer",
      "Competitor had better devices",
      "Competitor offered higher download speeds",
      "Competitor offered more data",
      "Product dissatisfaction",
      "Service dissatisfaction",
      "Long distance charges",
      "Attitude of service provider",
      "Attitude of support person",
      "Poor expertise of online support",
      "Poor expertise of phone support",
      "Extra data charges",
      "Price too high",
      "Lack of affordable download/upload speed",
      "Lack of self-service on Website"
  ]

  Involuntary=[
      "Limited range of services",
      "Network reliability",
      "Deceased",
      "Moved"
  ]

  Vague=[
      "Don't know"
  ]

  Hash_Contract={
      "Month-to-month":1,
      "Two year":2,
      "One year":3
  }

  Hash_Method={
      "Mailed check":1,
      "Electronic check":2,
      "Bank transfer (automatic)":3,
      "Credit card (automatic)":4
  }

  def __init__(self):
    self.Note=None
    self.Prediction=[]
    self.n=0
    # Data Planes
    self.Customer_ID=[]
    self.Tenure_Months=[]
    self.Contract_Type=[]
    self.Payment_Method=[]
    self.Monthly_Fee=[]
    self.Total_Charges=[]
    self.Churn_Label=[]
    self.CLTV=[]
    self.Property=[]

  def getProperty(self,x):
    if x in self.Voluntary:
      return 1
    if x in self.Involuntary:
      return 2
    if x in self.Vague:
      return 3
    else:
      return 0

  def getContract(self,x):
    if x>24:
      return 2
    if x>12:
      return 3
    else:
      return 1

  def GetDefault(self):
    self.Customer_ID=Customers["CustomerID"]
    self.Tenure_Months=Customers["Tenure Months"]
    self.Contract_Type=Customers["Contract"]
    self.Payment_Method=Customers["Payment Method"]
    self.Monthly_Fee=Customers["Monthly Charges"]
    self.Total_Charges=Customers["Total Charges"]
    self.Churn_Label=Customers["Churn Value"]
    self.CLTV=Customers["CLTV"]
    self.Property=[self.getProperty(items) for items in Customers["Churn Reason"]]

    self.n=len(self.Customer_ID)

  def GetData(self):
    # self.n=int(input("Number of customers: "))
    # for i in range(n):
    #   self.Customer_ID.append(str(input("Customer ID: ")))
    #   self.Tenure_Months.append(int(input("Tenure Months: ")))
    #   self.Contract_Type.append(str(input("Contract Type: ")))
    #   self.Payment_Method.append(str(input("Payment Method: ")))
    #   self.Monthly_Fee.append(float(input("Monthly Fee: ")))
    #   self.Total_Charges.append(self.Monthly_Fee[i]*self.Tenure_Months[i])
    #   self.Churn_Label.append(None)
    #   self.CLTV.append(float(input("CLTV: ")))


    self.n=random.randint(1,100)
    for i in range(self.n):
      self.Customer_ID.append(random.randint(1,8000))
      self.Tenure_Months.append(random.randint(0,72))
      self.Contract_Type.append(self.getContract(self.Tenure_Months[i]))
      self.Payment_Method.append(random.randint(1,4))
      self.Monthly_Fee.append(random.uniform(18.0,119.0))
      self.Total_Charges.append(self.Monthly_Fee[i]*self.Tenure_Months[i])
      self.Churn_Label.append(None)
      self.CLTV.append(random.randint(2000,4000))
      self.Property.append(None)

  def MakeNote(self):
    self.Note=pd.DataFrame({
        "Customer ID":self.Customer_ID,
        "Tenure Months":self.Tenure_Months,
        "Contract Type":self.Contract_Type,
        "Payment Method":self.Payment_Method,
        "Monthly Fee":self.Monthly_Fee,
        "Total Charges":self.Total_Charges,
        "Churn Label":self.Churn_Label,
        "CLTV":self.CLTV,
        "Property":self.Property
    })

  def PrintNote(self):
    return self.Note

  def Clean(self):
    self.Note=self.Note.drop(self.Note.loc[self.Note["Total Charges"]==" "].index)
    self.n=len(self.Note)

    # Hash for Machine Learning
    self.Note["Customer ID"]=list(range(len(self.Note)))
    self.Note["Contract Type"]=[self.Hash_Contract[items] for items in self.Note["Contract Type"]]
    self.Note["Payment Method"]=[self.Hash_Method[items] for items in self.Note["Payment Method"]]

  def Machine(self):
    FilteredData=self.Note.sample(frac=1).reset_index(drop=True)

    y=FilteredData["Churn Label"]

    ChosenFeatures=["Tenure Months","Monthly Fee","Total Charges","CLTV","Contract Type","Payment Method"]
    X=FilteredData[ChosenFeatures]

    train_X, val_X, train_y, val_y = train_test_split(X, y, test_size=0.01,random_state=42)

    _model=RandomForestRegressor(random_state=42)
    _model.fit(train_X,train_y)


    self.Prediction = _model.predict(val_X)

    plt.title("Prediction on random customers (@% from the sample)")

    x = np.array(list(range(len(self.Prediction))))
    y = np.array(self.Prediction)

    plt.bar(x,y,width=1)
    plt.show()

    plt.title("Likelihood of YES/NO (Churn)")

    GetLikelyYes=extract(self.Prediction>=0.5,self.Prediction)
    GetLikelyNo=extract(self.Prediction<0.5,self.Prediction)

    x=np.array(["YES","NO"])
    y=np.array([len(GetLikelyYes),len(GetLikelyNo)])

    plt.bar(x,y,width=0.75)
    plt.show()

    print(len(GetLikelyYes))
    print(len(GetLikelyNo))

  def MachineWithTester(self,Tester):
    print("\n--- New Sample ---")
    FilteredData=self.Note.sample(frac=1).reset_index(drop=True)

    y=FilteredData["Churn Label"]

    ChosenFeatures=["Tenure Months","Monthly Fee","Total Charges","CLTV","Contract Type","Payment Method"]
    X=FilteredData[ChosenFeatures]
    train_X, val_X, train_y, val_y = train_test_split(X, y, test_size=0.001,random_state=42)

    _model=RandomForestRegressor(random_state=42)
    _model.fit(train_X,train_y)


    self.Prediction = pd.DataFrame({"Score":_model.predict(Tester[ChosenFeatures])})

    result=pd.concat([Tester,self.Prediction],axis=1)
    result["Churn Label"]=np.where(result["Score"]>=0.5,1,0)

    def getPropertyByLabel(x):
      if x==0:
        return 0
      if x==1:
        return random.randint(1,3)

    result["Property"]=[getPropertyByLabel(items) for items in result["Churn Label"]]

    result=result.sort_values(by=["Tenure Months","Total Charges"])
    display(result)

    # def countLoss()

    print("\n--> Yearly Gross: ",result["Total Charges"].sum(),"\n")

    if len(self.Prediction)>1:
        plt.title("Scatter Plot")

        x=np.array(list(range(len(self.Prediction))))
        y=np.array(self.Prediction)

        plt.scatter(x,y)
        plt.show()

    plt.title("Likelihood of YES/NO (Churn)")

    GetLikelyYes=extract(self.Prediction>=0.5,self.Prediction)
    GetLikelyNo=extract(self.Prediction<0.5,self.Prediction)

    x=np.array(["YES","NO"])
    y=np.array([len(GetLikelyYes),len(GetLikelyNo)])

    plt.bar(x,y,width=0.75)
    plt.show()

    print("YES: ",len(GetLikelyYes))
    print("NO: ",len(GetLikelyNo))
    ChurnRateOnTesters.append(len(GetLikelyYes)*100.0/len(self.Prediction))

    if(len(GetLikelyYes)>0):
      print("\n--- Service Evaluation ---")
      plt.title("Reason Analysis")
      x = np.array(["Voluntary","Involuntary","Vague"])
      y = np.array([
          len(result.loc[result["Property"]==1]),
          len(result.loc[result["Property"]==2]),
          len(result.loc[result["Property"]==3])
      ])

      plt.bar(x,y)
      plt.show()

      print("Voluntary: ",len(result.loc[result["Property"]==1]))
      print("Involuntary: ",len(result.loc[result["Property"]==2]))
      print("Vague: ",len(result.loc[result["Property"]==3]))

def Casual():
  Book=Notebook()
  Book.GetDefault()
  Book.MakeNote()
  Book.Clean()
  Book.RateService()
  # Book.PrintNote()
  Book.Machine()

print("\n--- RANDOM TEST ---\n")

def SuperRandomMachine():
  loop=int(input("Refreshing Times: "))
  for i in range(loop):
    Book=Notebook()
    Book.GetDefault()
    Book.MakeNote()
    Book.Clean()

    NewBook=Notebook()
    NewBook.GetData()
    NewBook.MakeNote()

    Book.MachineWithTester(NewBook.Note)

    del Book
    del NewBook

ChurnRateOnTesters=[]
SuperRandomMachine()

Statistics=pd.DataFrame({"Rate":ChurnRateOnTesters})

print("\n--- Conclusion ---")

display(Statistics)
print("Churn Rate: ",Statistics["Rate"].mean())
print("Standard Deviation: ",np.std(Statistics["Rate"]))

# *A strong dataset : (Voluntary+Vague?>Involuntary)&(ChurnLabel:Yes<<No)
