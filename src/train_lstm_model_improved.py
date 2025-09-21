import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report

class EpocSeqDataset(Dataset):
    def __init__(self, sequences, labels):
        self.sequences = sequences
        self.labels = labels

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        return {
            'input': torch.tensor(self.sequences[idx], dtype=torch.float32),
            'label': torch.tensor(self.labels[idx], dtype=torch.long)
        }

class LSTMModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim, num_layers=2, dropout=0.3):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=dropout, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, output_dim)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])  # Use last timestep
        return out

def prepare_sequences(features_df, seq_length=10):
    data = features_df.drop(columns=['label', 'epoch']).values
    labels = features_df['label'].values
    sequences = []
    seq_labels = []

    for i in range(len(data) - seq_length + 1):
        seq = data[i:i+seq_length]
        label = labels[i+seq_length-1]  # Label aligned to last epoch
        sequences.append(seq)
        seq_labels.append(label)

    return np.array(sequences), np.array(seq_labels)

def train_lstm_model(features_csv='data/combined/features_multiclass.csv', seq_length=10, batch_size=32, epochs=20):
    df = pd.read_csv(features_csv)
    sequences, labels = prepare_sequences(df, seq_length)

    X_train, X_val, y_train, y_val = train_test_split(sequences, labels, test_size=0.2, random_state=42)

    # Compute class weights for balanced learning
    class_weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32)

    train_dataset = EpocSeqDataset(X_train, y_train)
    val_dataset = EpocSeqDataset(X_val, y_val)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = LSTMModel(input_dim=X_train.shape[2], hidden_dim=64, output_dim=3).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor.to(device))
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch in train_loader:
            inputs = batch['input'].to(device)
            labels = batch['label'].to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(train_loader):.4f}")

    # Validation
    model.eval()
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for batch in val_loader:
            inputs = batch['input'].to(device)
            labels = batch['label'].to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    print(classification_report(all_labels, all_preds, digits=4))

    torch.save(model.state_dict(), 'models/lstm_improved_apnea_model.pth')
    print("Improved LSTM model saved to models/lstm_improved_apnea_model.pth")

if __name__ == "__main__":
    train_lstm_model()